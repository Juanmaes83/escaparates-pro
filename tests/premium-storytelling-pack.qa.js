// QA smoke tests for Premium Storytelling Pack
// Run with: node tests/premium-storytelling-pack.qa.js
(function() {
    var fs = require('fs');
    var path = require('path');
    var vm = require('vm');

    var root = path.resolve(__dirname, '..');

    // Minimal DOM mock for the escape helpers used by the modules.
    global.document = {
        createElement: function(tag) {
            var value = '';
            return {
                set textContent(v) { value = String(v || ''); },
                get innerHTML() { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
            };
        }
    };

    global.window = global;
    global.EP = {};

    function loadScript(filePath) {
        var full = path.join(root, filePath);
        var code = fs.readFileSync(full, 'utf8');
        vm.runInThisContext(code, { filename: full });
    }

    function assert(cond, msg) {
        if (!cond) throw new Error('ASSERT FAIL: ' + msg);
    }

    function containsNone(text, patterns) {
        var lower = text.toLowerCase();
        return patterns.every(function(p) { return lower.indexOf(p.toLowerCase()) === -1; });
    }

    console.log('Loading core ScrollSections registry...');
    loadScript('js/scroll-sections.js');

    console.log('Loading new Scroll Sections...');
    loadScript('js/scroll-sections/real-estate-bidirectional-video-story-pro.js');
    loadScript('js/scroll-sections/product-scroll-scrub-features-pro.js');

    console.log('Loading core SectorBlueprints registry...');
    loadScript('js/sector-blueprints.js');

    console.log('Loading new Blueprint...');
    loadScript('js/sector-blueprints/luxury-real-estate-storytelling-pro.js');

    console.log('\nRunning assertions...\n');

    // 1. IDs are registered
    var ssIds = EP.ScrollSections.getAll().map(function(t) { return t.id; });
    assert(ssIds.indexOf('real-estate-bidirectional-video-story-pro') !== -1, 'Real Estate Scroll Section registered');
    assert(ssIds.indexOf('product-scroll-scrub-features-pro') !== -1, 'Product Scroll Section registered');

    var sbIds = EP.SectorBlueprints.getAll().map(function(t) { return t.id; });
    assert(sbIds.indexOf('luxury-real-estate-storytelling-pro') !== -1, 'Luxury Blueprint registered');

    // 2. Existing modules are not removed and new ones are additive
    assert(ssIds.length >= 2, 'Scroll Sections catalog remains additive');
    assert(sbIds.indexOf('real-estate') !== -1, 'Existing Property Signature PRO still present');
    assert(sbIds.indexOf('retail-product') !== -1, 'Existing Retail Product Launch PRO still present');
    assert(sbIds.indexOf('fashion-lookbook') !== -1, 'Existing Fashion Lookbook PRO still present');
    assert(sbIds.indexOf('agency-studio') !== -1, 'Existing Agency Studio Preview still present');

    // 3. Build outputs are non-empty standalone HTML documents
    var reHtml = EP.ScrollSections.buildDocument('real-estate-bidirectional-video-story-pro', [], {});
    assert(typeof reHtml === 'string' && reHtml.length > 1000, 'Real Estate HTML generated');
    assert(reHtml.indexOf('<!doctype html>') === 0 || reHtml.indexOf('<!DOCTYPE html>') === 0, 'Real Estate HTML has doctype');
    assert(reHtml.indexOf('lang="es"') !== -1, 'Real Estate HTML lang=es');

    var psHtml = EP.ScrollSections.buildDocument('product-scroll-scrub-features-pro', [], {});
    assert(typeof psHtml === 'string' && psHtml.length > 1000, 'Product HTML generated');
    assert(psHtml.indexOf('<!doctype html>') === 0 || psHtml.indexOf('<!DOCTYPE html>') === 0, 'Product HTML has doctype');
    assert(psHtml.indexOf('lang="es"') !== -1, 'Product HTML lang=es');

    var lreHtml = EP.SectorBlueprints.build('luxury-real-estate-storytelling-pro', [], {});
    assert(typeof lreHtml === 'string' && lreHtml.length > 1000, 'Luxury Blueprint HTML generated');
    assert(lreHtml.indexOf('<!doctype html>') === 0 || lreHtml.indexOf('<!DOCTYPE html>') === 0, 'Luxury Blueprint HTML has doctype');

    // 4. No Apple references in product viewer
    var applePatterns = ['apple', 'airpods', 'airpod', ''];
    assert(containsNone(psHtml, applePatterns), 'Product viewer contains no Apple references');

    // 5. Safe URL handling — javascript: rejected
    var reHtmlBadUrl = EP.ScrollSections.buildDocument('real-estate-bidirectional-video-story-pro', [], { ctaUrl: 'javascript:alert(1)' });
    assert(reHtmlBadUrl.indexOf('javascript:') === -1, 'Real Estate sanitizes javascript: URLs');

    // 6. Schemas expose expected fields
    var reSchema = EP.ScrollSectionsUI ? EP.ScrollSectionsUI.getSchema('real-estate-bidirectional-video-story-pro') : [];
    var psSchema = EP.ScrollSectionsUI ? EP.ScrollSectionsUI.getSchema('product-scroll-scrub-features-pro') : [];
    // ScrollSectionsUI may not be loaded; skip if absent.
    if (reSchema.length) {
        assert(reSchema.some(function(f) { return f.key === 'phase1Title'; }), 'Real Estate schema has phase1Title');
    }
    if (psSchema.length) {
        assert(psSchema.some(function(f) { return f.key === 'feature1Title'; }), 'Product schema has feature1Title');
    }
    var lreSchema = EP.SectorBlueprints.getSchema('luxury-real-estate-storytelling-pro');
    assert(lreSchema.some(function(f) { return f.key === 'heroLine1'; }), 'Luxury Blueprint schema has heroLine1');
    assert(lreSchema.some(function(f) { return f.key === 'properties'; }), 'Luxury Blueprint schema has properties');

    // 7. Media fallback does not crash when no media is provided
    assert(reHtml.indexOf('Sube un vídeo o imagen en el slot 1') !== -1, 'Real Estate shows fallback without media');
    assert(psHtml.indexOf('Sube un vídeo o imagen en el slot 1') !== -1, 'Product shows fallback without media');

    console.log('✓ All QA assertions passed.');
})();
