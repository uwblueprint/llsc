import { Field as ChakraField, Text } from '@chakra-ui/react';
import * as React from 'react';

export interface FieldProps extends Omit<ChakraField.RootProps, 'label'> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  errorText?: React.ReactNode;
  optionalText?: React.ReactNode;
  mb?: string | number; // allow override
}

export const Field = React.forwardRef<HTMLDivElement, FieldProps>(function Field(props, ref) {
  const { label, children, helperText, errorText, optionalText, mb = 4, ...rest } = props;
  return (
    <ChakraField.Root ref={ref} mb={mb} {...rest}>
      {label && (
        <ChakraField.Label>
          {label}
          <ChakraField.RequiredIndicator fallback={optionalText} />
        </ChakraField.Label>
      )}
      {children}
      {helperText && <ChakraField.HelperText>{helperText}</ChakraField.HelperText>}
      {errorText && (
        <Text color="red.500" fontSize="12px" mt={1}>
          {errorText}
        </Text>
      )}
    </ChakraField.Root>
  );
});
