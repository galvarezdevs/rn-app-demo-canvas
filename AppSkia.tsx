import React, {useRef, useState} from 'react';
import {View, StyleSheet, PanResponder, Dimensions} from 'react-native';
import ViewShot from 'react-native-view-shot';
import {
  Canvas,
  Path,
  Skia,
  SkPath,
  PaintStyle,
  Image,
  useImage,
} from '@shopify/react-native-skia';

const AppSkia = () => {
  const svgRef = useRef(null);

  const [paths, setPaths] = useState<SkPath[]>([]);

  const currentPath = useRef<SkPath | null>(null);

  const [, forceUpdate] = useState(0); // Para forzar render

  const background = useImage(require('./assets/bg_notebook.jpg'));

  const paint = Skia.Paint();
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(1.5);
  paint.setColor(Skia.Color('black'));
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
      <ViewShot
        ref={svgRef}
        style={styles.viewShot}
        options={{format: 'jpg', quality: 0.9}}>
        <Canvas style={styles.canvas}>
          {background && (
            <Image
              image={background}
              x={0}
              y={0}
              antiAlias
              opacity={0.3}
              fit={'fill'}
              width={Dimensions.get('screen').width * 1.0}
              height={Dimensions.get('screen').height * 0.95}>
              {paths.map((path, index) => (
                <Path key={index} path={path} paint={paint} />
              ))}
            </Image>
          )}
        </Canvas>
      </ViewShot>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  viewShot: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  canvas: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default AppSkia;
