'use client';

import { Box, Flex } from '@chakra-ui/react';
import Image, { type ImageProps } from 'next/image';
import type { ReactNode } from 'react';

type Illustration = {
  src: ImageProps['src'];
  alt: string;
  priority?: boolean;
};

interface AuthPageLayoutProps {
  children: ReactNode;
  illustration?: Illustration;
  /**
   * Optional custom element to render instead of the default hero image.
   */
  illustrationSlot?: ReactNode;
  /**
   * Whether the illustration should remain visible on small screens.
   */
  showIllustrationOnMobile?: boolean;
}

export function AuthPageLayout({
  children,
  illustration,
  illustrationSlot,
  showIllustrationOnMobile = false,
}: AuthPageLayoutProps) {
  const shouldRenderIllustration = illustrationSlot || illustration;

  return (
    <Flex minH="100vh" direction={{ base: 'column', md: 'row' }} bg="brand.background">
      <Flex
        flex="1"
        align="center"
        justify="center"
        px={{ base: 4, md: 12 }}
        py={{ base: 12, md: 0 }}
        bg="brand.surface"
      >
        <Box w="full" maxW={{ base: '480px', lg: '520px' }}>
          {children}
        </Box>
      </Flex>

      {shouldRenderIllustration && (
        <Box
          flex="1"
          minH={{ base: showIllustrationOnMobile ? '220px' : '0', md: '100vh' }}
          position="relative"
          display={{ base: showIllustrationOnMobile ? 'block' : 'none', md: 'block' }}
        >
          {illustrationSlot ? (
            illustrationSlot
          ) : illustration ? (
            <>
              <Image
                src={illustration.src}
                alt={illustration.alt}
                fill
                priority={illustration.priority}
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'cover', objectPosition: 'right' }}
              />
              <Box
                position="absolute"
                inset={0}
                bgGradient={{
                  base: 'linear(to-b, rgba(6, 16, 30, 0.65), rgba(6, 16, 30, 0.35))',
                  md: 'linear(to-r, rgba(6, 16, 30, 0.35), rgba(6, 16, 30, 0.1))',
                }}
                pointerEvents="none"
              />
            </>
          ) : null}
        </Box>
      )}
    </Flex>
  );
}
