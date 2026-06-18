const React = require('react');

const motion = new Proxy({}, {
  get: (_, tag) => ({ children, whileHover, whileTap, initial, animate, exit, transition, variants, custom, ...props }) =>
    React.createElement(tag, props, children),
});

module.exports = {
  motion,
  AnimatePresence: ({ children }) => children,
};
