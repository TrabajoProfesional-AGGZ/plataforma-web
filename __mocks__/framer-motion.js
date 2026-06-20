const React = require('react');

const motionCache = {};
const motion = new Proxy({}, {
  get: (_, tag) => {
    if (!motionCache[tag]) {
      motionCache[tag] = ({ children, whileHover, whileTap, initial, animate, exit, transition, variants, custom, ...props }) =>
        React.createElement(tag, props, children);
    }
    return motionCache[tag];
  },
});

module.exports = {
  motion,
  AnimatePresence: ({ children }) => children,
};
