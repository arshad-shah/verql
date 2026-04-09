import { Flex } from "@/primitives/layout/Flex";
import { Text } from "@/primitives/typography/Text";

interface SettingLabelProps {
    label: string;
    description?: string;
}

export function SettingLabel({ label, description }: SettingLabelProps) {
    return (
        <Flex direction="column" className="flex-1 min-w-0 mr-4">
            <Text size="sm" color="primary">{label}</Text>
            {description && (
                <Text size="xs" color="muted" className="mt-0.5">{description}</Text>
            )}
        </Flex>
    );
}