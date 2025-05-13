import React, {useRef, useState} from 'react';
import {View, StyleSheet, PanResponder} from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  SkPath,
  PaintStyle,
} from '@shopify/react-native-skia';

const AppSkia = () => {
  const [paths, setPaths] = useState<SkPath[]>([]);
  const currentPath = useRef<SkPath | null>(null);
  const [, forceUpdate] = useState(0); // Para forzar render

  const paint = Skia.Paint();
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(2);
  paint.setColor(Skia.Color('white'));
  paint.setAntiAlias(true);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: evt => {
        const path = Skia.Path.Make();
        path.moveTo(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
        currentPath.current = path;
        setPaths(prev => [...prev, path]);
      },

      onPanResponderMove: evt => {
        if (currentPath.current) {
          currentPath.current.lineTo(
            evt.nativeEvent.locationX,
            evt.nativeEvent.locationY,
          );
          forceUpdate(prev => prev + 1);
        }
      },

      onPanResponderRelease: () => {
        currentPath.current = null;
      },
    }),
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Canvas style={styles.canvas}>
        {paths.map((path, index) => (
          <Path key={index} path={path} paint={paint} />
        ))}
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvas: {
    flex: 1,
    backgroundColor: 'blue',
  },
});

export default AppSkia;
