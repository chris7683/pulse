import { ReactNode, forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface FullScreenSectionProps extends Omit<HTMLMotionProps<'section'>, 'ref'> {
  children: ReactNode
  className?: string
  id?: string
  background?: 'default' | 'gradient' | 'dark' | 'card'
}

const FullScreenSection = forwardRef<HTMLElement, FullScreenSectionProps>(
  ({ children, className, id, background = 'default', ...props }, ref) => {
    const backgroundClasses = {
      default: 'bg-background',
      gradient: 'bg-gradient-to-br from-background via-background to-accent/10',
      dark: 'bg-card',
      card: 'bg-card/50',
    }

    return (
      <motion.section
        ref={ref}
        id={id}
        className={cn(
          'snap-section min-h-screen w-full flex items-center justify-center relative overflow-hidden',
          backgroundClasses[background],
          className
        )}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        {...props}
      >
        {children}
      </motion.section>
    )
  }
)

FullScreenSection.displayName = 'FullScreenSection'

export { FullScreenSection }
