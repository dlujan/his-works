import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  Chip,
  Divider,
  IconButton,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";

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
  const [open, setOpen] = useState(false);

  const sortedTags = useMemo(() => {
    // Alphabetical
    return availableTags.sort();
  }, [availableTags, tags]);

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const clearAll = () => setTags([]);

  return (
    <View style={{ marginVertical: 8 }}>
      <View style={styles.labelRow}>
        <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
          Tags
        </Text>

        <View style={{ flexDirection: "row", gap: 6 }}>
          {tags.length > 0 && (
            <Text
              onPress={clearAll}
              style={{ color: theme.colors.primary, fontWeight: "600" }}
            >
              Clear
            </Text>
          )}
        </View>
      </View>

      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.tagsSelectBox,
          { borderColor: theme.colors.onSurfaceVariant },
        ]}
      >
        <Text style={{ color: theme.colors.onSurfaceVariant }}>
          Select tags
        </Text>
      </Pressable>

      <View style={styles.chipWrap}>
        {tags.map((t) => (
          <Chip
            key={t}
            onClose={() => toggleTag(t)}
            style={[
              styles.tagChip,
              { backgroundColor: theme.colors.primary + "18" },
            ]}
            textStyle={{ color: theme.colors.primary, fontWeight: "500" }}
          >
            {t}
          </Chip>
        ))}
      </View>

      {/* Modal bottom sheet */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />

        {/* Sheet */}
        <View
          style={[styles.sheet, { backgroundColor: theme.colors.background }]}
        >
          <View style={styles.sheetHeader}>
            <Text
              variant="titleMedium"
              style={{ color: theme.colors.onSurface }}
            >
              Select tags
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {tags.length > 0 && (
                <Text
                  onPress={clearAll}
                  style={{
                    color: theme.colors.primary,
                    fontWeight: "600",
                    marginRight: 8,
                  }}
                >
                  Clear
                </Text>
              )}
              <IconButton icon="close" onPress={() => setOpen(false)} />
            </View>
          </View>

          <Divider />

          <ScrollView
            style={{ maxHeight: 420 }}
            contentContainerStyle={{ paddingVertical: 4 }}
          >
            {sortedTags.map((t) => {
              const selected = tags.includes(t);

              return (
                <TouchableRipple key={t} onPress={() => toggleTag(t)}>
                  <View style={styles.row}>
                    <Text
                      style={{
                        color: selected
                          ? theme.colors.primary
                          : theme.colors.onSurface,
                        fontWeight: selected ? "700" : "400",
                      }}
                    >
                      {t}
                    </Text>

                    <View style={styles.right}>
                      {selected ? (
                        <Text
                          style={{
                            color: theme.colors.primary,
                            fontWeight: "700",
                          }}
                        >
                          ✓
                        </Text>
                      ) : (
                        <Text style={{ color: theme.colors.onSurfaceVariant }}>
                          +
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableRipple>
              );
            })}
          </ScrollView>

          <Divider />

          <Pressable
            onPress={() => setOpen(false)}
            style={[styles.doneBtn, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>
              Done ({tags.length})
            </Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tagChip: {
    marginTop: 6,
    marginRight: 6,
    borderRadius: 20,
  },
  tagsSelectBox: {
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 6,
  },
  sheetHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  right: {
    width: 24,
    alignItems: "flex-end",
  },
  doneBtn: {
    margin: 12,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
