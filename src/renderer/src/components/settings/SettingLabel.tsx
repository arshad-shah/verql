import { Flex } from "@/primitives/layout/Flex";
import { Text } from "@arshad-shah/cynosure-react/text";

interface SettingLabelProps {
    label: string;
    description?: string;
}

export function SettingLabel({ label, description }: SettingLabelProps) {
    return (
        <Flex direction="column" className="flex-1 min-w-0 mr-4">
            <Text size="sm">{label}</Text>
            {description && (
                <Text size="xs" color="fg.subtle" className="mt-0.5">{description}</Text>
            )}
        </Flex>
    );
}