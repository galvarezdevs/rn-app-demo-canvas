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
import ViewShot, { captureRef } from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import {
  Canvas,
  Path,
  Skia,
  SkPath,
  PaintStyle,
  Image,
  useImage,
} from '@shopify/react-native-skia';

const COLORS = [
  '#000000', // black
  '#fc0303', // red
];

const STROKE_SIZE = [1, 2];

const EXTENSIONS = {
  JPG: '.jpg',
  PNG: '.png',
};

const AppSkia = () => {
  const svgRef = useRef(null);

  const [paths, setPaths] = useState<SkPath[]>([]);

  const currentPath = useRef<SkPath | null>(null);

  const [, forceUpdate] = useState(0); // Para forzar render

  const [color, setColor] = useState(COLORS[0]);

  const [stroke, setStroke] = useState(STROKE_SIZE[0]);

  const background = useImage(require('./assets/bg_notebook.jpg'));

  const paint = Skia.Paint();
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(stroke);
  paint.setColor(Skia.Color(color));
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
    setPaths([]);
  };

  const handleToogleColor = () => {
    if (color === COLORS[0]) {
      setColor(COLORS[1]);
    } else {
      setColor(COLORS[0]);
    }
  };

  const handleToogleStroke = () => {
    if (stroke === STROKE_SIZE[0]) {
      setStroke(STROKE_SIZE[1]);
    } else {
      setStroke(STROKE_SIZE[0]);
    }
  };

  const handleUndoLastPath = () => {
    setPaths(prevPaths => {
      if (prevPaths.length > 0) {
        return prevPaths.slice(0, -1);
      }
      return prevPaths;
    });
  };

  const handleSaveImage = async () => {
    try {
      if (paths.length<=0) {
        return;
      }
      const uri = await captureRef(svgRef, {
        format: 'jpg', // Puedes usar 'png' también
        quality: 0.1, // Opcional: calidad de la imagen (0 a 1)
      });
      console.log('Imagen guardada temporalmente en:', uri);

      // Define la ruta donde quieres guardar la imagen permanentemente
      const filename = 'picture_' + Date.now() + EXTENSIONS.JPG;
      // rutas que funcionan:
      // RNFS.ExternalCachesDirectoryPath --> carpeta cache
      // RNFS.ExternalDirectoryPath --> carpeta files
      const destPath = `${RNFS.ExternalDirectoryPath}/${filename}`;

      // Mueve el archivo temporal a la ubicación deseada
      await RNFS.moveFile(uri, destPath);

      Alert.alert('Imagen guardada en:' + destPath);
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
        style={[styles.itemButton, {backgroundColor: color}]}
        onPress={handleToogleColor}>
        <Text style={styles.textButtonHeader}>COLOR</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.itemButton} onPress={handleToogleStroke}>
        <Text style={styles.textButtonHeader}>GROSOR={stroke}</Text>
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
