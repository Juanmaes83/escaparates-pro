from pathlib import Path

root = Path('breeze-source')

# Breeze Studio PRO V4.1
# Dual-video runtime hardening applied AFTER V4.
# Goal: background video + cloth video must coexist without repainting the
# cloth CanvasTexture on every WebGPU render tick.

p = root / 'src' / 'clothGeometry.js'
s = p.read_text(encoding='utf-8')

# 1) Cleanup must cancel any requestVideoFrameCallback loop before destroying
#    the video/object URL/texture.
old = """        if (this.userMediaVideo) {
            try { this.userMediaVideo.pause(); } catch (_) {}
            this.userMediaVideo.removeAttribute('src');
            try { this.userMediaVideo.load(); } catch (_) {}
            this.userMediaVideo = null;
        }
"""
new = """        if (this.userMediaVideo) {
            if (this.userMediaFrameHandle != null && this.userMediaVideo.cancelVideoFrameCallback) {
                try { this.userMediaVideo.cancelVideoFrameCallback(this.userMediaFrameHandle); } catch (_) {}
            }
            this.userMediaFrameHandle = null;
            this.userMediaFrameLoopActive = false;
            try { this.userMediaVideo.pause(); } catch (_) {}
            this.userMediaVideo.removeAttribute('src');
            try { this.userMediaVideo.load(); } catch (_) {}
            this.userMediaVideo = null;
        }
"""
if old not in s:
    raise SystemExit('V4.1 cleanup target not found')
s = s.replace(old, new, 1)

# 2) Replace renderer-tick redraw with video-frame-driven scheduling.
old = """    updateUserMediaFrame() {
        if (this.userMediaVideo && this.userMediaVideo.readyState >= 2 && !this.userMediaVideo.paused) {
            this.redrawUserMedia();
        }
    }

"""
new = """    scheduleUserMediaFrameLoop() {
        const video = this.userMediaVideo;
        if (!video || this.userMediaFrameLoopActive) return;
        this.userMediaFrameLoopActive = true;
        this.userMediaLastPaintMs = 0;

        if (video.requestVideoFrameCallback) {
            const onFrame = (now) => {
                if (!this.userMediaFrameLoopActive || video !== this.userMediaVideo) return;
                // Cap CPU grading uploads at ~30 fps even when source is 50/60 fps.
                // A new GPU texture upload only happens for a decoded frame, never
                // for every Breeze/WebGPU render tick.
                if (!this.userMediaLastPaintMs || now - this.userMediaLastPaintMs >= 30) {
                    this.redrawUserMedia();
                    this.userMediaLastPaintMs = now;
                }
                this.userMediaFrameHandle = video.requestVideoFrameCallback(onFrame);
            };
            this.userMediaFrameHandle = video.requestVideoFrameCallback(onFrame);
            return;
        }

        // Legacy fallback: timer is deliberately independent from renderer FPS.
        const fallback = () => {
            if (!this.userMediaFrameLoopActive || video !== this.userMediaVideo) return;
            if (video.readyState >= 2 && !video.paused) this.redrawUserMedia();
            this.userMediaFrameHandle = window.setTimeout(fallback, 50);
        };
        this.userMediaFrameHandle = window.setTimeout(fallback, 50);
    }

    updateUserMediaFrame() {
        // V4.1: intentionally NO per-render canvas copy.
        // Video frames are uploaded by scheduleUserMediaFrameLoop().
    }

"""
if old not in s:
    raise SystemExit('V4.1 updateUserMediaFrame target not found')
s = s.replace(old, new, 1)

# 3) The fallback timer also needs cleanup on browsers without rVFC.
needle = """            if (this.userMediaFrameHandle != null && this.userMediaVideo.cancelVideoFrameCallback) {
                try { this.userMediaVideo.cancelVideoFrameCallback(this.userMediaFrameHandle); } catch (_) {}
            }
"""
replace = """            if (this.userMediaFrameHandle != null) {
                if (this.userMediaVideo.cancelVideoFrameCallback) {
                    try { this.userMediaVideo.cancelVideoFrameCallback(this.userMediaFrameHandle); } catch (_) {}
                } else {
                    try { clearTimeout(this.userMediaFrameHandle); } catch (_) {}
                }
            }
"""
s = s.replace(needle, replace, 1)

# 4) Reduce grading working surface. Visual/model render can remain high-res;
#    only the transient CPU grading texture is bounded.
s = s.replace('        const maxSide = 2048;', '        const maxSide = 1024;', 1)

# 5) Start the frame-driven update only for video, after the material texture is
#    installed. Initial redraw still guarantees an immediate visible frame.
old = """        this.redrawUserMedia();
        this.applyUserMediaTransform(transform);
        this.applyUserLook(this.userMediaLook);
        return { kind: isVideo ? 'video' : 'image', texture: map };
"""
new = """        this.redrawUserMedia();
        this.applyUserMediaTransform(transform);
        this.applyUserLook(this.userMediaLook);
        if (isVideo) this.scheduleUserMediaFrameLoop();
        return { kind: isVideo ? 'video' : 'image', texture: map };
"""
if old not in s:
    raise SystemExit('V4.1 applyUserMediaFile tail not found')
s = s.replace(old, new, 1)

p.write_text(s, encoding='utf-8')

# 6) Remove the now-useless renderer-loop callback entirely. Keeping it as a
#    no-op would be safe, but removing it prevents future regressions.
p = root / 'src' / 'app.js'
s = p.read_text(encoding='utf-8')
s = s.replace('        this.clothGeometry?.updateUserMediaFrame?.();\n        await this.renderer.renderAsync(this.scene, this.camera);',
              '        await this.renderer.renderAsync(this.scene, this.camera);', 1)
p.write_text(s, encoding='utf-8')

print('Breeze Studio PRO V4.1 applied: dual-video frame-driven cloth pipeline')
