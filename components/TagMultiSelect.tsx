import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { MultiSelect } from "react-native-element-dropdown";
import { Chip, Text, useTheme } from "react-native-paper";

export function TagMultiSelect({
  availableTags,
  tags,
  setTags,
}: {
  availableTags: string[];
  tags: string[];
  setTags: (value: string[]) => void;
}) {
  const theme = useTheme();

  // 🔹 Custom rendering for dropdown items
  const renderItem = (item: { label: string; value: string }) => {
    const isSelected = tags.includes(item.value);
    return (
      <View
        style={[
          styles.item,
          isSelected && {
            backgroundColor: theme.colors.primary + "20",
          },
        ]}
      >
        <Text
          style={[
            styles.itemText,
            {
              color: isSelected ? theme.colors.primary : theme.colors.onSurface,
              fontWeight: isSelected ? "600" : "400",
            },
          ]}
        >
          {item.label}
        </Text>
      </View>
    );
  };

  return (
    <View style={{ marginVertical: 8 }}>
      <Text
        variant="titleSmall"
        style={{ marginBottom: 4, color: theme.colors.onSurface }}
      >
        Tags
      </Text>

      <MultiSelect
        style={styles.dropdown}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        data={availableTags.map((tag) => ({ label: tag, value: tag }))}
        labelField="label"
        valueField="value"
        placeholder="Select Tags"
        value={tags}
        search
        searchPlaceholder="Search tags..."
        onChange={(items) => setTags(items)}
        renderItem={renderItem} // ✅ Custom item renderer
        renderSelectedItem={(item, unSelect) => (
          <TouchableOpacity
            key={item.value}
            onPress={() => unSelect && unSelect(item)}
          >
            <Chip
              onClose={() => unSelect && unSelect(item)}
              style={[
                styles.tagChip,
                { backgroundColor: theme.colors.primary + "20" },
              ]}
              textStyle={{
                color: theme.colors.primary,
                fontWeight: "500",
              }}
            >
              {item.label}
            </Chip>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  itemText: {
    fontSize: 16,
  },
  placeholderStyle: {
    color: "#999",
  },
  selectedTextStyle: {
    color: "#000",
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  tagChip: {
    marginTop: 6,
    marginRight: 6,
    borderRadius: 20,
  },
});
