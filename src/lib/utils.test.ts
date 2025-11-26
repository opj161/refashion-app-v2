import { cn } from './utils';

describe('cn', () => {
  describe('Basic functionality', () => {
    it('should merge class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle single class name', () => {
      expect(cn('foo')).toBe('foo');
    });

    it('should handle empty inputs', () => {
      expect(cn()).toBe('');
      expect(cn('')).toBe('');
      expect(cn('', '')).toBe('');
    });

    it('should handle null and undefined values', () => {
      expect(cn(null, 'foo', undefined, 'bar')).toBe('foo bar');
    });

    it('should handle arrays of classes', () => {
      expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
    });
  });

  describe('Conditional classes (clsx functionality)', () => {
    it('should handle conditional class names', () => {
      expect(cn('foo', { bar: true, baz: false })).toBe('foo bar');
    });

    it('should handle multiple conditional objects', () => {
      expect(cn({ foo: true }, { bar: false }, { baz: true })).toBe('foo baz');
    });

    it('should handle mixed conditional and static classes', () => {
      expect(cn('base', { active: true, disabled: false }, 'extra')).toBe('base active extra');
    });

    it('should handle falsy values gracefully', () => {
      expect(cn(false && 'hidden', true && 'visible')).toBe('visible');
    });
  });

  describe('Tailwind merge functionality', () => {
    it('should merge conflicting padding classes', () => {
      expect(cn('p-2', 'p-4')).toBe('p-4');
    });

    it('should merge conflicting margin classes', () => {
      expect(cn('m-2', 'm-4')).toBe('m-4');
    });

    it('should merge conflicting background classes', () => {
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });

    it('should preserve non-conflicting classes', () => {
      expect(cn('px-2 py-1 bg-red hover:bg-dark-red', 'p-4 bg-blue')).toBe('hover:bg-dark-red p-4 bg-blue');
    });

    it('should handle spacing conflicts correctly', () => {
      expect(cn('p-4', 'px-2')).toBe('p-4 px-2');
      expect(cn('px-2', 'p-4')).toBe('p-4');
    });

    it('should handle text color conflicts', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should handle width conflicts', () => {
      expect(cn('w-full', 'w-1/2')).toBe('w-1/2');
    });

    it('should handle height conflicts', () => {
      expect(cn('h-10', 'h-20')).toBe('h-20');
    });

    it('should preserve hover and focus states', () => {
      expect(cn('bg-primary hover:bg-primary/90', 'bg-destructive')).toBe('hover:bg-primary/90 bg-destructive');
    });
  });

  describe('Real-world component scenarios', () => {
    it('should handle button variant merging', () => {
      const baseClasses = 'inline-flex items-center justify-center rounded-md px-4 py-2';
      const variantClasses = 'bg-primary text-primary-foreground';
      const customClasses = 'bg-destructive mt-4';
      
      const result = cn(baseClasses, variantClasses, customClasses);
      
      // Should override bg-primary with bg-destructive, keep other classes
      expect(result).toContain('bg-destructive');
      expect(result).toContain('mt-4');
      expect(result).toContain('inline-flex');
      expect(result).not.toContain('bg-primary');
    });

    it('should handle badge variant merging', () => {
      const baseClasses = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs';
      const variantClasses = 'border-transparent bg-primary text-primary-foreground';
      const customClasses = 'bg-secondary';
      
      const result = cn(baseClasses, variantClasses, customClasses);
      
      expect(result).toContain('bg-secondary');
      expect(result).not.toContain('bg-primary');
    });

    it('should handle conditional styling with props', () => {
      const isActive = true;
      const isDisabled = false;
      
      const result = cn(
        'base-class',
        {
          'active-class': isActive,
          'disabled-class': isDisabled,
        }
      );
      
      expect(result).toBe('base-class active-class');
    });

    it('should merge className prop correctly', () => {
      // Simulating component pattern: cn(baseStyles, className)
      const baseStyles = 'p-4 bg-primary';
      const propClassName = 'p-2 bg-destructive';
      
      const result = cn(baseStyles, propClassName);
      
      // Prop className should override base styles
      expect(result).toBe('p-2 bg-destructive');
    });
  });

  describe('Edge cases', () => {
    it('should handle extremely long class strings', () => {
      const longString = Array(100).fill('class').join(' ');
      const result = cn(longString, 'extra');
      expect(result).toContain('extra');
    });

    it('should handle special characters in class names', () => {
      expect(cn('hover:bg-blue-500', 'focus:ring-2')).toBe('hover:bg-blue-500 focus:ring-2');
    });

    it('should handle arbitrary values', () => {
      expect(cn('w-[100px]', 'w-[200px]')).toBe('w-[200px]');
    });

    it('should handle important modifier', () => {
      expect(cn('!text-red-500', 'text-blue-500')).toBe('!text-red-500 text-blue-500');
    });
  });
});
