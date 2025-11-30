"use client";

import { Navbar } from '@/components/Navbar';
import { Container, Title, Text, Center } from '@mantine/core';

export default function QuizzesPage() {
    return (
        <>
            <Navbar />
            <Container size="md" py="xl">
                <Center style={{ minHeight: '50vh', flexDirection: 'column' }}>
                    <Title order={1}>Quizzes</Title>
                    <Title order={2} mt="md">Coming Soon!!</Title>
                    <Text c="dimmed" mt="sm">This section is under construction.</Text>
                </Center>
            </Container>
        </>
    );
}
