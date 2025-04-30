import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ColorValue, TouchableOpacity, Text, Alert, PermissionsAndroid, SafeAreaView, Modal, Image, Pressable, ImageBackground } from 'react-native';
import Svg, {Path} from 'react-native-svg';
import ViewShot, { captureRef } from 'react-native-view-shot';
import RNFS from 'react-native-fs';

type PathType = {
  path: string[];
  color: string;
  stroke: number;
};

type SigningPathType = PathType[];

const COLORS = [
  '#000000', // black
  '#fc0303', // red
];

const EXTENSIONS = {
  JPG: '.jpg',
  PNG: '.png',
};

export const STROKE_SIZE = [1, 3, 6];

// Hook personalizado para debounce
function useDebounce(callback: (...args: any[]) => void, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
}

const ModalImg = (props: any) => {
  const {visible, imgUrl, callback} = props;
  const [modalVisible, setModalVisible] = useState(visible ?? false);
  useEffect(() => {setModalVisible(props.visible)}, [props]);
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => {
        setModalVisible(!modalVisible);
      }}>
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <View style={{
          margin: 20,
          backgroundColor: 'yellow',
          borderRadius: 20,
          padding: 35,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}>
          <Text>Guardado en:</Text>
          <Text>{imgUrl}</Text>
          <Pressable
            style={{
              borderRadius: 20,
              padding: 10,
              elevation: 2,
              backgroundColor: '#F194FF',
            }}
            onPress={() => {
              setModalVisible(false);
              callback();
            }}>
            <Text>CERRAR [X]</Text>
          </Pressable>
          <Image src={"file://"+imgUrl} style={{width: 300, height: 200, marginVertical: 30}} resizeMethod='scale' resizeMode='contain' />
        </View>
      </View>
    </Modal>
  );
}

const App = () => {
  const svgRef = useRef(null);
  const [paths, setPaths] = useState<SigningPathType>([]);
  const [color, setColor] = useState(COLORS[0]);
  const [stroke, setStroke] = useState(STROKE_SIZE[0]);
  const [lastImgUrl, setLastUrlImg] = useState('');

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
          }
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
          }
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

  const setNewPath = (x: number, y: number) => {
    setPaths(prev => {
      const result = [...prev, { path: [`M${x} ${y}`], color, stroke }];
      return result;
    });
  };

  const debouncedUpdatePath = useDebounce((x: number, y: number) => {
    setPaths(prev => {
      const currentPath = prev[prev.length - 1];
      if (currentPath) {
        const updatedPath = { ...currentPath, path: [...currentPath.path, `L${x} ${y}`] };
        return [...prev.slice(0, -1), updatedPath];
      }
      return prev;
    });
  }, 0); // fix: re-renders...

  const clearCanvas = () => {
    setPaths([]);
  };

  const toogleColor = () => {
    if (color == COLORS[0]) {
      setColor(COLORS[1]);
    } else {
      setColor(COLORS[0]);
    }
  };

  const toogleStroke = () => {
    if (stroke == STROKE_SIZE[0]) {
      setStroke(STROKE_SIZE[1]);
    } else {
      setStroke(STROKE_SIZE[0]);
    }
  };

  const handleSaveImage = async () => {
    try {
      if (paths.length<=0) {
        return;
      }
      const uri = await captureRef(svgRef, {
        format: 'jpg', // Puedes usar 'png' también
        quality: 0.8, // Opcional: calidad de la imagen (0 a 1)
      });
      console.log('Imagen guardada temporalmente en:', uri);

      // Define la ruta donde quieres guardar la imagen permanentemente
      const filename = 'drawing_' + Date.now() + EXTENSIONS.JPG;
      // rutas que funcionan:
      // RNFS.ExternalCachesDirectoryPath --> carpeta cache
      // RNFS.ExternalDirectoryPath --> carpeta files
      const destPath = `${RNFS.ExternalDirectoryPath}/${filename}`;

      // Mueve el archivo temporal a la ubicación deseada
      await RNFS.moveFile(uri, destPath);

      console.log('Imagen guardada en:', destPath);
      setLastUrlImg(destPath);
    } catch (error) {
      console.error('Error al guardar la imagen:', error);
      Alert.alert('Error al guardar la imagen.');
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

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.itemButton} onPress={clearCanvas}>
        <Text style={styles.textButtonHeader}>LIMPIAR</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.itemButton, { backgroundColor: color }]} onPress={toogleColor}>
        <Text style={styles.textButtonHeader}>COLOR</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.itemButton} onPress={toogleStroke}>
        <Text style={styles.textButtonHeader}>GROSOR={stroke}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.itemButton, {backgroundColor: 'purple'}]} onPress={handleUndoLastPath}>
        <Text style={styles.textButtonHeader}>DESHACER</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.itemButton} onPress={handleSaveImage}>
        <Text style={styles.textButtonHeader}>GUARDAR</Text>
      </TouchableOpacity>
    </View>
  );

  const closeModal = () => {
    setLastUrlImg('');
    clearCanvas();
  };

  const renderBody = () => (
    <View style={styles.body}>
      <View
          style={styles.canvas}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderStart={e => {
            setNewPath(e?.nativeEvent?.locationX, e?.nativeEvent?.locationY);
          }}
          onResponderMove={e => {
            debouncedUpdatePath(e?.nativeEvent?.locationX, e?.nativeEvent?.locationY);
          }}>
            <ViewShot ref={svgRef} options={{ format: 'jpg', quality: 0.9 }}>
              <ImageBackground source={require("./assets/bg_notebook.png")}>
                <Svg style={{ backgroundColor: 'transparent' }}>
                  {paths.map(({path, color: c, stroke: s}, i) => (
                    <Path
                      key={i}
                      d={`${path.join(' ')}`}
                      fill="none"
                      strokeWidth={`${s}px`}
                      stroke={c as ColorValue}
                    />
                  ))}
                </Svg>
              </ImageBackground>
            </ViewShot>
      </View>
    </View>
  );

  const renderContainer = () => (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderBody()}
      <ModalImg visible={lastImgUrl != ''} imgUrl={lastImgUrl} callback={closeModal} />
    </SafeAreaView>
  );

  useEffect(() => {
    requestStoragePermission();
  }, []);

  return renderContainer();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
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
  body: {
    width: '100%',
    height: '85%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    height: '90%',
    shadowColor: '#000',
    shadowRadius: 10,
    elevation: 10,
  },
});

export default App;
