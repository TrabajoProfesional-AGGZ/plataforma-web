const React = require('react');

const motionCache = {};
const motion = new Proxy({}, {
  get: (_, tag) => {
    if (!motionCache[tag]) {
      motionCache[tag] = ({ children, whileHover, whileTap, initial, animate, exit, transition, variants, custom, layoutId, layout, onAnimationComplete, ...props }) => {
        React.useEffect(() => {
          if (onAnimationComplete) onAnimationComplete();
        }, [onAnimationComplete]);
        return React.createElement(tag, props, children);
      };
    }
    return motionCache[tag];
  },
});

module.exports = {
  motion,
  AnimatePresence: ({ children }) => children,
  MotionConfig: ({ children }) => children,
  useReducedMotion: () => false,
  useAnimation: () => ({ start: () => Promise.resolve(), set: () => {} }),
};
