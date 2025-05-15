import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
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
  PNG: '.png',
};

const AppSkia = () => {
  const svgRef = useRef(null);

  const paths = useRef<DrawablePath[]>([]);

  const currentPath = useRef<SkPath | null>(null);

  const currentPaint = useRef<SkPaint | null>(null);

  const [, forceUpdate] = useState(0);

  const color = useRef<string>(COLORS[0]);

  const stroke = useRef<number>(STROKE_SIZE[0]);

  const background = useImage(require('./assets/bg_notebook.jpg'));

  const forceRender = () => forceUpdate(prev => prev + 1);

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
        currentPaint.current = newPaint;
        paths.current = [
          ...paths.current,
          {
            path: newPath,
            paint: newPaint,
          },
        ];
      },

      onPanResponderMove: evt => {
        if (currentPath.current && currentPaint.current) {
          currentPath.current.lineTo(
            evt.nativeEvent.locationX,
            evt.nativeEvent.locationY,
          );
          currentPaint.current.setColor(Skia.Color(color.current));
          currentPaint.current.setStyle(PaintStyle.Stroke);
          currentPaint.current.setStrokeWidth(stroke.current);
          currentPaint.current.setAntiAlias(true);
          console.log('*color, stroke', color.current, stroke.current);
          forceRender();
        }
      },

      onPanResponderRelease: () => {
        currentPath.current = null;
        currentPaint.current = null;
      },
    }),
  ).current;

  const requestStoragePermission = () => {
    try {
      const consult1 = async () => {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to storage to display images.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('READ_EXTERNAL_STORAGE permission granted');
        } else {
          console.log('READ_EXTERNAL_STORAGE permission denied');
        }
      };
      const consult2 = async () => {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to storage to display images.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('WRITE_EXTERNAL_STORAGE permission granted');
        } else {
          console.log('WRITE_EXTERNAL_STORAGE permission denied');
        }
      };
      consult1();
      consult2();
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
    const nextIndex = (currentIndex + 1) % COLORS.length;
    color.current = COLORS[nextIndex];
    forceRender();
  };

  const handleToggleStroke = () => {
    const currentIndex = STROKE_SIZE.indexOf(stroke.current);
    const nextIndex = (currentIndex + 1) % STROKE_SIZE.length;
    stroke.current = STROKE_SIZE[nextIndex];
    forceRender();
  };

  const handleUndoLastPath = (): void => {
    if (paths.current.length > 0) {
      paths.current = paths.current.slice(0, -1);
      forceRender();
    }
  };

  const handleSaveImage = async () => {
    try {
      if (paths.current.length <= 0) {
        return;
      }
      const uri = await captureRef(svgRef, {
        format: 'jpg', // Puedes usar 'png' también
        quality: 0.1, // Opcional: calidad de la imagen (0 a 1)
      });

      const filename = 'picture_' + Date.now() + EXTENSIONS.JPG;
      // RNFS.ExternalCachesDirectoryPath --> carpeta cache
      // RNFS.ExternalDirectoryPath --> carpeta files
      const destPath = `${RNFS.ExternalDirectoryPath}/${filename}`;

      // Mueve el archivo temporal a la ubicación deseada
      await RNFS.moveFile(uri, destPath);

      Alert.alert('Imagen guardada en:' + destPath);

      handleClearCanvas();
    } catch (error) {
      console.error('Error al guardar la imagen:', error);
      Alert.alert('Error al guardar la imagen.');
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.itemButton} onPress={handleClearCanvas}>
        <Text style={styles.textButtonHeader}>LIMPIAR</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.itemButton, {backgroundColor: color.current}]}
        onPress={handleToggleColor}>
        <Text style={styles.textButtonHeader}>COLOR</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.itemButton,
          {borderColor: color.current, borderWidth: stroke.current},
        ]}
        onPress={handleToggleStroke}>
        <Text style={styles.textButtonHeader}>GROSOR={stroke.current}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.itemButton} onPress={handleUndoLastPath}>
        <Text style={styles.textButtonHeader}>DESHACER</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.itemButton} onPress={handleSaveImage}>
        <Text style={styles.textButtonHeader}>GUARDAR</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBody = () => (
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
              fit={'none'}
              width={Dimensions.get('screen').width}
              height={Dimensions.get('screen').height}>
              {paths.current.map((p, i) => (
                <Path key={i} path={p.path} paint={p.paint} />
              ))}
            </Image>
          )}
        </Canvas>
      </ViewShot>
    </View>
  );

  const renderContainer = () => (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderBody()}
    </SafeAreaView>
  );

  useEffect(() => {
    requestStoragePermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return renderContainer();
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
    width: '100%',
    height: 100,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemButton: {
    backgroundColor: '#3491c7',
    height: '100%',
    width: 80,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    borderRadius: 10,
    elevation: 5,
  },
  textButtonHeader: {
    color: 'white',
    fontSize: 12,
  },
});

export default AppSkia;
