import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  SafeAreaView,
  Pressable as ButtonUI,
  Text,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import ViewShot, {captureRef} from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import {
  Canvas,
  Path,
  Skia,
  SkPath,
  PaintStyle,
  Image,
  useImage,
  SkPaint,
} from '@shopify/react-native-skia';

type DrawablePath = {
  path: SkPath;
  paint: SkPaint;
};

const COLORS = [
  'black',
  'red',
  'blue',
  'green',
  'pink',
  'yellow',
  'brown',
  'purple',
];

const STROKE_SIZE = [1, 2, 3, 4, 5, 6];

const EXTENSIONS = {
  JPG: '.jpg',
};

const AppSkia = () => {
  const svgRef = useRef(null);
  const paths = useRef<DrawablePath[]>([]);
  const currentPath = useRef<SkPath | null>(null);
  const [, forceUpdate] = useState(0);

  const color = useRef<string>(COLORS[0]);
  const stroke = useRef<number>(STROKE_SIZE[0]);
  const background = useImage(require('./assets/bg_notebook.jpg'));

  const forceRender = () =>
    requestAnimationFrame(() => forceUpdate(prev => prev + 1));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: evt => {
        const newPath = Skia.Path.Make();
        newPath.moveTo(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
        const newPaint = Skia.Paint();
        newPaint.setColor(Skia.Color(color.current));
        newPaint.setStyle(PaintStyle.Stroke);
        newPaint.setStrokeWidth(stroke.current);
        newPaint.setAntiAlias(true);
        currentPath.current = newPath;
        paths.current.push({path: newPath, paint: newPaint});
      },

      onPanResponderMove: evt => {
        if (currentPath.current) {
          currentPath.current.lineTo(
            evt.nativeEvent.locationX,
            evt.nativeEvent.locationY,
          );
          forceRender();
        }
      },

      onPanResponderRelease: () => {
        currentPath.current = null;
      },
    }),
  ).current;

  const requestStoragePermission = async () => {
    try {
      const perms = [
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ];
      for (const perm of perms) {
        const granted = await PermissionsAndroid.request(perm);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn(`${perm} permission denied`);
        }
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const handleClearCanvas = () => {
    paths.current = [];
    forceRender();
  };

  const handleToggleColor = () => {
    const currentIndex = COLORS.indexOf(color.current);
    color.current = COLORS[(currentIndex + 1) % COLORS.length];
    forceRender();
  };

  const handleToggleStroke = () => {
    const currentIndex = STROKE_SIZE.indexOf(stroke.current);
    stroke.current = STROKE_SIZE[(currentIndex + 1) % STROKE_SIZE.length];
    forceRender();
  };

  const handleUndoLastPath = () => {
    if (paths.current.length > 0) {
      paths.current.pop();
      forceRender();
    }
  };

  const handleSaveImage = async () => {
    try {
      if (paths.current.length === 0) {
        return;
      }
      const uri = await captureRef(svgRef, {
        format: 'jpg',
        quality: 0.9,
      });

      const filename = `picture_${Date.now()}${EXTENSIONS.JPG}`;
      const destPath = `${RNFS.ExternalDirectoryPath}/${filename}`;
      await RNFS.moveFile(uri, destPath);

      Alert.alert('Imagen guardada en:', destPath);
      handleClearCanvas();
    } catch (error) {
      console.error('Error al guardar la imagen:', error);
      Alert.alert('Error al guardar la imagen.');
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {[
        {label: 'LIMPIAR', onPress: handleClearCanvas},
        {label: 'COLOR', onPress: handleToggleColor},
        {
          label: `GROSOR=${stroke.current}`,
          onPress: handleToggleStroke,
        },
        {label: 'DESHACER', onPress: handleUndoLastPath},
        {label: 'GUARDAR', onPress: handleSaveImage},
      ].map(({label, onPress}, idx) => (
        <ButtonUI
          key={idx}
          style={[
            styles.itemButton,
            {borderColor: color.current, borderWidth: stroke.current},
          ]}
          onPress={onPress}>
          <Text style={styles.textButtonHeader}>{label}</Text>
        </ButtonUI>
      ))}
    </View>
  );

  const renderCanvas = () => (
    <Canvas style={styles.canvas}>
      {background && (
        <Image
          image={background}
          x={0}
          y={0}
          fit="fill"
          width={background.width()}
          height={background.height()}
        />
      )}
      {paths.current.map((p, i) => (
        <Path key={i} path={p.path} paint={p.paint} />
      ))}
    </Canvas>
  );

  useEffect(() => {
    requestStoragePermission();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <View style={styles.container} {...panResponder.panHandlers}>
        <ViewShot
          ref={svgRef}
          style={styles.viewShot}
          options={{format: 'jpg', quality: 0.9}}>
          {renderCanvas()}
        </ViewShot>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  viewShot: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  canvas: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    backgroundColor: 'yellow',
    width: '100%',
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemButton: {
    backgroundColor: '#3491c7',
    height: '100%',
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 10,
  },
  textButtonHeader: {
    color: 'white',
    fontSize: 12,
  },
});

export default AppSkia;
