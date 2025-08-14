import "react-native";

// Extend the StyleProp types to be more flexible with conditional styles
declare module "react-native" {
  interface ViewStyle {
    transition?: string;
  }

  // Make StyleProp more flexible to handle conditional styles
  export type StyleProp<T> = T | Array<any>;

  // Override component props to accept more flexible style types
  interface ViewProps {
    style?: any;
  }

  interface TextProps {
    style?: any;
  }

  interface TouchableOpacityProps {
    style?: any;
  }

  interface TextInputProps {
    style?: any;
  }

  // Override the Button and Card component props
  namespace ReactNativeFC {
    interface ButtonProps {
      style?: any;
    }

    interface CardProps {
      style?: any;
    }
  }
}
