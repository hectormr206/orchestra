import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';

export interface MenuItem {
  label: string;
  value: string;
  icon?: string;
  description?: string;
}

interface MenuProps {
  items: MenuItem[];
  onSelect: (item: MenuItem) => void;
  title?: string;
}

export const Menu: React.FC<MenuProps> = ({ items, onSelect, title }) => {
  const handleSelect = (item: { label: string; value: string }) => {
    const menuItem = items.find((i) => i.value === item.value);
    if (menuItem) {
      onSelect(menuItem);
    }
  };

  const formattedItems = items.map((item) => ({
    label: `${item.icon || '→'} ${item.label}`,
    value: item.value,
  }));

  return (
    <Box flexDirection="column">
      {title && (
        <Box marginBottom={1}>
          <Text bold color="cyan">{title}</Text>
        </Box>
      )}
      <SelectInput
        items={formattedItems}
        onSelect={handleSelect}
        indicatorComponent={({ isSelected }) => (
          <Text color={isSelected ? 'green' : 'gray'}>
            {isSelected ? '▶ ' : '  '}
          </Text>
        )}
        itemComponent={({ isSelected, label }) => (
          <Text color={isSelected ? 'green' : 'white'} bold={isSelected}>
            {label}
          </Text>
        )}
      />
    </Box>
  );
};
