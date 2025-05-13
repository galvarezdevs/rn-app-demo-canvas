import React, {useEffect, useRef, useState} from 'react';
import {PanResponder, StyleSheet, View} from 'react-native';
import {
  Skia,
  Canvas,
  PaintStyle,
  Path,
  SkPath,
  PathOp,
} from '@shopify/react-native-skia';

const AppSkia = () => {
  const [path, setPath] = useState<SkPath>(Skia.Path.Make());
  const paint = useRef(Skia.Paint());
  const tp = useRef(Skia.Path.Make());

  useEffect(() => {
    paint.current.setColor(Skia.Color('white'));
    paint.current.setStyle(PaintStyle.Stroke);
    paint.current.setStrokeWidth(3);
    paint.current.setAntiAlias(true);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: evt => {
        tp.current?.moveTo(
          evt.nativeEvent.locationX,
          evt.nativeEvent.locationY,
        );
      },
      onPanResponderMove: evt => {
        tp.current?.lineTo(
          evt.nativeEvent.locationX,
          evt.nativeEvent.locationY,
        );
        setPath(
          Skia.Path.MakeFromOp(tp.current, tp.current, PathOp.Union) ||
            Skia.Path.Make(),
        );
      },
    }),
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Canvas style={styles.canvas}>
        <Path path={path} paint={paint.current} antiAlias />
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
