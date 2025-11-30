import { Tooltip as ChakraTooltip, Portal } from '@chakra-ui/react';
import * as React from 'react';

export interface TooltipProps extends ChakraTooltip.RootProps {
  showArrow?: boolean;
  portalled?: boolean;
  portalRef?: React.RefObject<HTMLElement>;
  content: React.ReactNode;
  contentProps?: ChakraTooltip.ContentProps;
  disabled?: boolean;
}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(props, ref) {
  const {
    showArrow,
    children,
    disabled,
    portalled = true,
    content,
    contentProps,
    portalRef,
    openDelay = 0,
    closeDelay = 0,
    ...rest
  } = props;

  if (disabled) return children;

  return (
    <ChakraTooltip.Root openDelay={openDelay} closeDelay={closeDelay} {...rest}>
      <ChakraTooltip.Trigger>{children}</ChakraTooltip.Trigger>
      <Portal disabled={!portalled} container={portalRef}>
        <ChakraTooltip.Positioner>
          <ChakraTooltip.Content
            ref={ref}
            bg="#1D3448"
            color="white"
            px={3}
            py={2}
            borderRadius="6px"
            fontSize="14px"
            fontFamily="'Open Sans', sans-serif"
            maxW="280px"
            boxShadow="0px 4px 12px rgba(0, 0, 0, 0.15)"
            zIndex={9999}
            {...contentProps}
          >
            {showArrow && (
              <ChakraTooltip.Arrow>
                <ChakraTooltip.ArrowTip />
              </ChakraTooltip.Arrow>
            )}
            {content}
          </ChakraTooltip.Content>
        </ChakraTooltip.Positioner>
      </Portal>
    </ChakraTooltip.Root>
  );
});
