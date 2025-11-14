import { View } from "react-native";
import { Button } from "react-native-paper";
import { BottomSheetModal } from "./BottomSheetModal";

const ReportModal = ({
  visible,
  title,
  onDismiss,
  onReport,
}: {
  visible: boolean;
  title?: string;
  onDismiss: () => void;
  onReport: (reason: string) => void;
}) => {
  const handleReport = (reason: string) => {
    onReport(reason);
    onDismiss();
  };
  return (
    <BottomSheetModal
      visible={visible}
      onDismiss={onDismiss}
      title={title}
      subtitle="Your report is anonymous. If someone is in immediate danger, call the local emergency services - don't wait."
    >
      <View style={{ gap: 8 }}>
        <Button onPress={() => handleReport("Bullying or unwanted contact")}>
          Bullying or unwanted contact
        </Button>
        <Button
          onPress={() =>
            handleReport("Suicide, self-injury or eating disorders")
          }
        >
          Suicide, self-injury or eating disorders
        </Button>
        <Button onPress={() => handleReport("Violence, hate, or exploitation")}>
          Violence, hate, or exploitation
        </Button>
        <Button
          onPress={() => handleReport("Selling or promoting restricted items")}
        >
          Selling or promoting restricted items
        </Button>
        <Button onPress={() => handleReport("Nudity or sexual activity")}>
          Nudity or sexual activity
        </Button>
        <Button
          onPress={() =>
            handleReport("Inappropriate conduct involving a minor")
          }
        >
          Inappropriate conduct involving a minor
        </Button>
        <Button onPress={() => handleReport("Scam, fraid, or spam")}>
          Scam, fraud, or spam
        </Button>
        <Button onPress={() => handleReport("Intellectual property")}>
          Intellectual property
        </Button>
        <Button onPress={() => handleReport("I just don't like it")}>
          I just don't like it
        </Button>
      </View>
    </BottomSheetModal>
  );
};

export default ReportModal;
