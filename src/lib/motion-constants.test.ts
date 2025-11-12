import { COMMON_VARIANTS, MOTION_TRANSITIONS } from './motion-constants';

describe('COMMON_VARIANTS', () => {
  describe('fadeIn variant', () => {
    it('should have hidden and visible states', () => {
      expect(COMMON_VARIANTS.fadeIn).toHaveProperty('hidden');
      expect(COMMON_VARIANTS.fadeIn).toHaveProperty('visible');
    });

    it('should fade from opacity 0 to 1', () => {
      expect(COMMON_VARIANTS.fadeIn.hidden).toEqual({ opacity: 0 });
      expect(COMMON_VARIANTS.fadeIn.visible).toMatchObject({ opacity: 1 });
    });

    it('should use standard tween transition', () => {
      expect(COMMON_VARIANTS.fadeIn.visible.transition).toBe(MOTION_TRANSITIONS.tween.standard);
    });
  });

  describe('slideDownAndFade variant', () => {
    it('should have hidden, visible, and exit states', () => {
      expect(COMMON_VARIANTS.slideDownAndFade).toHaveProperty('hidden');
      expect(COMMON_VARIANTS.slideDownAndFade).toHaveProperty('visible');
      expect(COMMON_VARIANTS.slideDownAndFade).toHaveProperty('exit');
    });

    it('should slide from y: -15 to y: 0', () => {
      expect(COMMON_VARIANTS.slideDownAndFade.hidden).toEqual({ opacity: 0, y: -15 });
      expect(COMMON_VARIANTS.slideDownAndFade.visible).toMatchObject({ opacity: 1, y: 0 });
    });

    it('should have consistent exit animation', () => {
      expect(COMMON_VARIANTS.slideDownAndFade.exit).toMatchObject({ opacity: 0, y: -15 });
    });

    it('should use quick transition for visible state', () => {
      expect(COMMON_VARIANTS.slideDownAndFade.visible.transition).toBe(MOTION_TRANSITIONS.tween.quick);
    });

    it('should use fast transition for exit state', () => {
      expect(COMMON_VARIANTS.slideDownAndFade.exit.transition).toBe(MOTION_TRANSITIONS.tween.fast);
    });
  });

  describe('pageTransition variant', () => {
    it('should have hidden, visible, and exit states', () => {
      expect(COMMON_VARIANTS.pageTransition).toHaveProperty('hidden');
      expect(COMMON_VARIANTS.pageTransition).toHaveProperty('visible');
      expect(COMMON_VARIANTS.pageTransition).toHaveProperty('exit');
    });

    it('should use subtle y-axis movement', () => {
      expect(COMMON_VARIANTS.pageTransition.hidden).toEqual({ opacity: 0, y: 8 });
      expect(COMMON_VARIANTS.pageTransition.visible).toEqual({ opacity: 1, y: 0 });
      expect(COMMON_VARIANTS.pageTransition.exit).toEqual({ opacity: 0, y: -8 });
    });

    it('should create a smooth slide-up effect on entry', () => {
      expect(COMMON_VARIANTS.pageTransition.hidden.y).toBeGreaterThan(0);
      expect(COMMON_VARIANTS.pageTransition.visible.y).toBe(0);
    });

    it('should create a slide-down effect on exit', () => {
      expect(COMMON_VARIANTS.pageTransition.exit.y).toBeLessThan(0);
    });
  });

  describe('staggeredListContainer variant', () => {
    it('should have hidden and visible states', () => {
      expect(COMMON_VARIANTS.staggeredListContainer).toHaveProperty('hidden');
      expect(COMMON_VARIANTS.staggeredListContainer).toHaveProperty('visible');
    });

    it('should fade in as container', () => {
      expect(COMMON_VARIANTS.staggeredListContainer.hidden).toEqual({ opacity: 0 });
      expect(COMMON_VARIANTS.staggeredListContainer.visible).toMatchObject({ opacity: 1 });
    });

    it('should have stagger timing configuration', () => {
      const visibleTransition = COMMON_VARIANTS.staggeredListContainer.visible.transition;
      expect(visibleTransition).toHaveProperty('staggerChildren');
      expect(visibleTransition).toHaveProperty('delayChildren');
    });

    it('should stagger children by 0.07s', () => {
      expect(COMMON_VARIANTS.staggeredListContainer.visible.transition.staggerChildren).toBe(0.07);
    });

    it('should delay children by 0.1s', () => {
      expect(COMMON_VARIANTS.staggeredListContainer.visible.transition.delayChildren).toBe(0.1);
    });
  });

  describe('staggeredListItem variant', () => {
    it('should have hidden, visible, and exit states', () => {
      expect(COMMON_VARIANTS.staggeredListItem).toHaveProperty('hidden');
      expect(COMMON_VARIANTS.staggeredListItem).toHaveProperty('visible');
      expect(COMMON_VARIANTS.staggeredListItem).toHaveProperty('exit');
    });

    it('should animate from below with scale', () => {
      expect(COMMON_VARIANTS.staggeredListItem.hidden).toEqual({ y: 20, opacity: 0, scale: 0.98 });
      expect(COMMON_VARIANTS.staggeredListItem.visible).toMatchObject({ y: 0, opacity: 1, scale: 1 });
    });

    it('should use spring transition for smooth physics-based animation', () => {
      expect(COMMON_VARIANTS.staggeredListItem.visible.transition).toBe(MOTION_TRANSITIONS.spring.gentle);
    });

    it('should have subtle exit animation', () => {
      expect(COMMON_VARIANTS.staggeredListItem.exit).toMatchObject({ 
        opacity: 0, 
        scale: 0.98 
      });
    });

    it('should have tween-based exit for quick removal', () => {
      expect(COMMON_VARIANTS.staggeredListItem.exit.transition).toMatchObject({ 
        duration: 0.2, 
        ease: 'easeOut' 
      });
    });
  });

  describe('Variant consistency', () => {
    it('should use consistent opacity values across variants', () => {
      expect(COMMON_VARIANTS.fadeIn.hidden.opacity).toBe(0);
      expect(COMMON_VARIANTS.slideDownAndFade.hidden.opacity).toBe(0);
      expect(COMMON_VARIANTS.pageTransition.hidden.opacity).toBe(0);
      expect(COMMON_VARIANTS.staggeredListItem.hidden.opacity).toBe(0);
    });

    it('should use consistent scale values for list items', () => {
      expect(COMMON_VARIANTS.staggeredListItem.hidden.scale).toBe(0.98);
      expect(COMMON_VARIANTS.staggeredListItem.visible.scale).toBe(1);
      expect(COMMON_VARIANTS.staggeredListItem.exit.scale).toBe(0.98);
    });

    it('should reference existing MOTION_TRANSITIONS', () => {
      // Verify that variants use existing transition configs
      expect(MOTION_TRANSITIONS.tween.standard).toBeDefined();
      expect(MOTION_TRANSITIONS.tween.quick).toBeDefined();
      expect(MOTION_TRANSITIONS.tween.fast).toBeDefined();
      expect(MOTION_TRANSITIONS.spring.gentle).toBeDefined();
    });
  });

  describe('Type safety', () => {
    it('should be immutable (as const)', () => {
      // TypeScript will enforce this at compile time
      // This test just ensures the structure is correct
      expect(typeof COMMON_VARIANTS).toBe('object');
      expect(Object.isFrozen(COMMON_VARIANTS)).toBe(false); // as const doesn't freeze, but TS enforces immutability
    });

    it('should have all expected variant keys', () => {
      const expectedKeys = [
        'fadeIn',
        'slideDownAndFade',
        'pageTransition',
        'staggeredListContainer',
        'staggeredListItem'
      ];
      
      expectedKeys.forEach(key => {
        expect(COMMON_VARIANTS).toHaveProperty(key);
      });
    });
  });
});
