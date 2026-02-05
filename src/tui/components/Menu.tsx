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
    <Box flexDirection="column" backgroundColor="black">
      {title && (
        <Box marginBottom={1} backgroundColor="black">
          <Text bold color="cyan" backgroundColor="black">
            {title}
          </Text>
        </Box>
      )}
      {items.map((item, index) => {
        const isSelected = index === selectedIndex;
        return (
          <Box key={item.value} backgroundColor="black">
            <Text color={isSelected ? "green" : "cyan"} backgroundColor="black">
              {isSelected ? "▶ " : "  "}
            </Text>
            <Box width={4} backgroundColor="black">
              <Text backgroundColor="black">{item.icon || "→"}</Text>
            </Box>
            <Text
              color={isSelected ? "green" : "cyan"}
              backgroundColor="black"
              bold={isSelected}
            >
              {item.label}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
};
