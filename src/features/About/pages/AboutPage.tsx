import {
  Box,
  Card,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Link,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  IconChartBar,
  IconCode,
  IconCreditCard,
  IconHeart,
  IconMail,
  IconPaperclip,
  IconReceipt2,
  IconSparkles,
  type Icon as TablerIcon,
} from "@tabler/icons-react";
import { pageStaggerSlideLeftCompact } from "@/shared/animation/chakraMotion";
import { BrandIcon } from "@/shared/components/icons/BrandIcon";

const CONTACT_EMAIL = "jorgerodrigues9@outlook.com";

const FEATURES: { icon: TablerIcon; title: string; description: string }[] = [
  {
    icon: IconChartBar,
    title: "Dashboard",
    description:
      "Spending by month and year, with a drill-down into every category.",
  },
  {
    icon: IconReceipt2,
    title: "Expenses & bills",
    description: "Log purchases and keep track of what's due and what's paid.",
  },
  {
    icon: IconCreditCard,
    title: "Credit card statements",
    description:
      "Upload Nubank or Inter PDFs and review every purchase, sorted for you.",
  },
  {
    icon: IconPaperclip,
    title: "Attachments",
    description: "Keep receipts and invoices next to the expense they belong to.",
  },
];

function SectionTitle({ icon, children }: { icon: TablerIcon; children: string }) {
  return (
    <HStack gap={3} align="center">
      <Icon as={icon} boxSize={6} color="green.fg" flexShrink={0} />
      <Card.Title textStyle="lg">{children}</Card.Title>
    </HStack>
  );
}

export default function AboutPage() {
  return (
    <Container maxW="3xl" py={{ base: 2, md: 4 }} px={{ base: 0, sm: 4 }}>
      <VStack align="stretch" gap={{ base: 6, md: 8 }}>
        <Box
          borderRadius="xl"
          px={{ base: 5, md: 8 }}
          py={{ base: 8, md: 10 }}
          bg="bg.panel"
          bgGradient="to-br"
          gradientFrom="green.500/15"
          gradientVia="bg.panel"
          gradientTo="teal.600/15"
          borderWidth="1px"
          borderColor="border.subtle"
          {...pageStaggerSlideLeftCompact(0)}
        >
          <VStack align="flex-start" gap={4}>
            <BrandIcon boxSize={{ base: 14, md: 16 }} />
            <VStack align="flex-start" gap={2}>
              <Heading as="h1" size="3xl" letterSpacing="tight">
                About
              </Heading>
              <Text
                fontSize={{ base: "lg", md: "xl" }}
                color="fg.muted"
                lineHeight="tall"
                maxW="2xl"
              >
                My Expense Tracker helps you see where your money goes—month by
                month, category by category—so you can plan with confidence
                instead of guessing.
              </Text>
            </VStack>
          </VStack>
        </Box>

        <Card.Root
          variant="outline"
          borderRadius="xl"
          {...pageStaggerSlideLeftCompact(55)}
        >
          <Card.Header pb={4}>
            <SectionTitle icon={IconSparkles}>What you can do</SectionTitle>
          </Card.Header>
          <Card.Body pt={0}>
            <SimpleGrid as="ul" columns={{ base: 1, sm: 2 }} gap={5} listStyleType="none">
              {FEATURES.map((feature) => (
                <HStack as="li" key={feature.title} gap={3} align="flex-start">
                  <Flex
                    boxSize={9}
                    flexShrink={0}
                    align="center"
                    justify="center"
                    borderRadius="lg"
                    bg="green.subtle"
                    color="green.fg"
                  >
                    <Icon as={feature.icon} boxSize={5} />
                  </Flex>
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold">
                      {feature.title}
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                      {feature.description}
                    </Text>
                  </Box>
                </HStack>
              ))}
            </SimpleGrid>
          </Card.Body>
        </Card.Root>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <Card.Root
            variant="outline"
            borderRadius="xl"
            {...pageStaggerSlideLeftCompact(110)}
          >
            <Card.Header pb={2}>
              <SectionTitle icon={IconCode}>Built with</SectionTitle>
            </Card.Header>
            <Card.Body pt={0}>
              <Text color="fg.muted" lineHeight="tall">
                React, TypeScript, and Vite on the front end; Chakra UI for
                layout and accessibility; Convex for sync, auth, and data; and
                Google Gemini to read credit card statements—so updates feel
                instant and your information stays scoped to your account.
              </Text>
            </Card.Body>
          </Card.Root>

          <Card.Root
            variant="outline"
            borderRadius="xl"
            {...pageStaggerSlideLeftCompact(165)}
          >
            <Card.Header pb={2}>
              <SectionTitle icon={IconHeart}>Why we built it</SectionTitle>
            </Card.Header>
            <Card.Body pt={0}>
              <Text color="fg.muted" lineHeight="tall">
                Personal finance tools work best when they stay out of the way:
                fast to open, easy to log a purchase, and honest about totals.
                We built this app around that idea—clarity first, clutter
                never.
              </Text>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

        <Card.Root
          variant="outline"
          borderRadius="xl"
          bg="bg.panel"
          {...pageStaggerSlideLeftCompact(220)}
        >
          <Card.Header pb={2}>
            <SectionTitle icon={IconMail}>Contact</SectionTitle>
          </Card.Header>
          <Card.Body pt={0}>
            <Text color="fg.muted" lineHeight="tall" mb={3}>
              Questions, ideas, or bug reports? Send a message—we read every
              email.
            </Text>
            <Link
              href={`mailto:${CONTACT_EMAIL}`}
              colorPalette="green"
              fontWeight="medium"
            >
              {CONTACT_EMAIL}
            </Link>
          </Card.Body>
        </Card.Root>

        <HStack
          justify="center"
          gap={2}
          color="fg.subtle"
          fontSize="sm"
          {...pageStaggerSlideLeftCompact(275)}
        >
          <BrandIcon boxSize={5} />
          <Text>Thanks for using My Expense Tracker.</Text>
        </HStack>
      </VStack>
    </Container>
  );
}
