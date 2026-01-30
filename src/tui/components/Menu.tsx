import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

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
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    }
    if (key.downArrow) {
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    }
    if (key.return) {
      onSelect(items[selectedIndex]);
    }
  });

  return (
    <Box flexDirection="column">
      {title && (
        <Box marginBottom={1}>
          <Text bold color="cyan">
            {title}
          </Text>
        </Box>
      )}
      {items.map((item, index) => {
        const isSelected = index === selectedIndex;
        return (
          <Box key={item.value}>
            <Text color={isSelected ? "green" : "gray"}>
              {isSelected ? "▶ " : "  "}
            </Text>
            <Box width={4}>
              <Text>{item.icon || "→"}</Text>
            </Box>
            <Text color={isSelected ? "green" : "white"} bold={isSelected}>
              {item.label}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
};
