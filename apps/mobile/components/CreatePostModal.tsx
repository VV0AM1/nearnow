import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { CATEGORIES } from '../constants/categories';
import api from '../services/api';

interface CreatePostModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreatePostModal({ visible, onClose, onSuccess }: CreatePostModalProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0].id); // Default to first (usually ALL, but should be specific)
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Initial category should specific
    React.useEffect(() => {
        if (CATEGORIES.length > 1 && category === 'ALL') {
            setCategory(CATEGORIES[1].id);
        }
    }, []);

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera permission is required to take photos.');
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    }

    const handleSubmit = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }
        // Content is optional now

        setLoading(true);

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Location is required to post alerts.');
                setLoading(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});

            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('category', category);
            formData.append('latitude', location.coords.latitude.toString());
            formData.append('longitude', location.coords.longitude.toString());

            if (image) {
                const filename = image.split('/').pop() || 'upload.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                // @ts-ignore: React Native FormData expects specific object
                formData.append('file', {
                    uri: image,
                    name: filename,
                    type,
                });
            }

            await api.post('/posts', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            Alert.alert('Success', 'Alert posted successfully!');
            setTitle('');
            setContent('');
            setImage(null);
            onSuccess();
            onClose();

        } catch (error: any) {
            console.error('Create post error:', error);
            Alert.alert('Error', 'Failed to create post. ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end">
                {/* Backdrop */}
                <TouchableOpacity
                    className="absolute top-0 bottom-0 left-0 right-0 bg-black/50"
                    activeOpacity={1}
                    onPress={onClose}
                />

                <View className="bg-white dark:bg-neutral-900 rounded-t-3xl h-[85%] w-full p-6 shadow-xl">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-2xl font-bold dark:text-white">New Alert</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close-circle" size={30} color="gray" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Image Upload */}
                        <View className="mb-6">
                            {image ? (
                                <View className="relative">
                                    <Image source={{ uri: image }} className="w-full h-48 rounded-xl" resizeMode="cover" />
                                    <TouchableOpacity
                                        className="absolute top-2 right-2 bg-black/50 p-2 rounded-full"
                                        onPress={() => setImage(null)}
                                    >
                                        <Ionicons name="trash" size={20} color="white" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View className="flex-row space-x-4">
                                    <TouchableOpacity
                                        className="flex-1 bg-gray-100 dark:bg-neutral-800 h-32 rounded-xl justify-center items-center border-2 border-dashed border-gray-300 dark:border-neutral-700"
                                        onPress={pickImage}
                                    >
                                        <Ionicons name="image" size={30} color="gray" />
                                        <Text className="text-gray-500 mt-2">Gallery</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        className="flex-1 bg-gray-100 dark:bg-neutral-800 h-32 rounded-xl justify-center items-center border-2 border-dashed border-gray-300 dark:border-neutral-700"
                                        onPress={takePhoto}
                                    >
                                        <Ionicons name="camera" size={30} color="gray" />
                                        <Text className="text-gray-500 mt-2">Camera</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Title */}
                        <View className="mb-4">
                            <Text className="text-gray-500 dark:text-gray-400 mb-2 font-medium">Title</Text>
                            <TextInput
                                className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-xl text-lg font-semibold dark:text-white"
                                placeholder="What's happening?"
                                placeholderTextColor="gray"
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>

                        {/* Description */}
                        <View className="mb-4">
                            <Text className="text-gray-500 dark:text-gray-400 mb-2 font-medium">Description</Text>
                            <TextInput
                                className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-xl text-base dark:text-white min-h-[100]"
                                placeholder="Add more details..."
                                placeholderTextColor="gray"
                                multiline
                                textAlignVertical="top"
                                value={content}
                                onChangeText={setContent}
                            />
                        </View>

                        {/* Category */}
                        <View className="mb-8">
                            <Text className="text-gray-500 dark:text-gray-400 mb-2 font-medium">Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                {CATEGORIES.filter(c => c.id !== 'ALL').map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        onPress={() => setCategory(cat.id)}
                                        className={`mr-3 px-4 py-2 rounded-full ${category === cat.id ? cat.color : 'bg-gray-100 dark:bg-neutral-800'
                                            }`}
                                    >
                                        <Text className={`font-medium ${category === cat.id ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                                            }`}>
                                            {cat.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <TouchableOpacity
                            className={`p-4 rounded-xl mb-8 flex-row justify-center items-center ${loading ? 'bg-blue-400' : 'bg-blue-600'
                                }`}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Post Alert</Text>
                            )}
                        </TouchableOpacity>

                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
