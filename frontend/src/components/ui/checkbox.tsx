import { Checkbox as ChakraCheckbox } from '@chakra-ui/react';
import * as React from 'react';

export interface CheckboxProps extends ChakraCheckbox.RootProps {
  icon?: React.ReactNode;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  rootRef?: React.Ref<HTMLLabelElement>;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(props, ref) {
    const { icon, children, inputProps, rootRef, ...rest } = props;
    return (
      <ChakraCheckbox.Root ref={rootRef} {...rest}>
        <ChakraCheckbox.HiddenInput ref={ref} {...inputProps} />
        <ChakraCheckbox.Control
          width="16px"
          height="16px"
          border="1px solid"
          borderColor="#D1D5DB"
          borderRadius="4px"
          bg="white"
          _checked={{
            bg: "rgba(179, 206, 209, 0.3)",
            borderColor: "#056067",
            color: "#056067"
          }}
          _focus={{
            outline: "none",
            boxShadow: "0 0 0 2px rgba(5, 96, 103, 0.2)"
          }}
          _hover={{
            borderColor: "#056067"
          }}
          _disabled={{
            opacity: 0.5,
            cursor: "not-allowed"
          }}
        >
          {icon || (
            <ChakraCheckbox.Indicator
              style={{
                strokeWidth: '4px'
              }}
            />
          )}
        </ChakraCheckbox.Control>
        {children != null && <ChakraCheckbox.Label>{children}</ChakraCheckbox.Label>}
      </ChakraCheckbox.Root>
    );
  },
);
