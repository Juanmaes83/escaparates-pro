// Escaparates Pro — Interactive Boards registry.
(function() {
    'use strict';
    window.EP = window.EP || {};
    var BOARDS = Object.create(null);
    function register(board) {
        if (!board || !board.id) throw new Error('Interactive Board requires id');
        BOARDS[board.id] = board;
        return board;
    }
    function get(id) { return BOARDS[id] || null; }
    function getAll() { return Object.keys(BOARDS).map(function(id) { return BOARDS[id]; }); }
    EP.InteractiveBoards = { register: register, get: get, getAll: getAll };
})();
