import { Image, View } from "react-native";
const logo = require("../assets/images/icon-cropped-320x320.png");

const HeaderTitleLogo = () => {
  return (
    <View
      style={{
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        top: -2,
      }}
    >
      <Image
        source={logo}
        resizeMode="contain"
        style={{ width: 40, height: 40 }}
      />
    </View>
  );
};
export default HeaderTitleLogo;
