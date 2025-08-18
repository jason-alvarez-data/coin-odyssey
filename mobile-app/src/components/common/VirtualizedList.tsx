// src/components/common/VirtualizedList.tsx
import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { 
  FlatList, 
  View, 
  Dimensions, 
  ListRenderItem,
  ViewToken,
  FlatListProps
} from 'react-native';

interface VirtualizedListProps<T> extends Omit<FlatListProps<T>, 'renderItem' | 'getItemLayout'> {
  data: T[];
  renderItem: ListRenderItem<T>;
  itemHeight: number;
  numColumns?: number;
  overscan?: number;
  enableVirtualization?: boolean;
  memoryOptimized?: boolean;
  onViewableItemsChanged?: (info: { viewableItems: ViewToken[], changed: ViewToken[] }) => void;
}

// Memory-optimized virtualized list for large collections
export function VirtualizedList<T>({
  data,
  renderItem,
  itemHeight,
  numColumns = 1,
  overscan = 5,
  enableVirtualization = true,
  memoryOptimized = true,
  onViewableItemsChanged,
  ...props
}: VirtualizedListProps<T>) {
  const [viewableIndices, setViewableIndices] = useState(new Set<number>());
  const listRef = useRef<FlatList>(null);
  const screenHeight = Dimensions.get('window').height;
  
  // Calculate how many items fit on screen
  const itemsPerScreen = Math.ceil(screenHeight / itemHeight) * numColumns;
  const bufferSize = overscan * numColumns;

  // Memoized item layout for performance
  const getItemLayout = useCallback((data: any, index: number) => ({
    length: itemHeight,
    offset: itemHeight * Math.floor(index / numColumns),
    index,
  }), [itemHeight, numColumns]);

  // Handle viewable items change
  const handleViewableItemsChanged = useCallback(({ viewableItems, changed }: {
    viewableItems: ViewToken[];
    changed: ViewToken[];
  }) => {
    if (memoryOptimized) {
      const newViewableIndices = new Set<number>();
      
      viewableItems.forEach(item => {
        if (item.index !== null) {
          // Add buffer around viewable items
          const startIndex = Math.max(0, item.index - bufferSize);
          const endIndex = Math.min(data.length - 1, item.index + bufferSize);
          
          for (let i = startIndex; i <= endIndex; i++) {
            newViewableIndices.add(i);
          }
        }
      });
      
      setViewableIndices(newViewableIndices);
    }
    
    onViewableItemsChanged?.({ viewableItems, changed });
  }, [data.length, bufferSize, memoryOptimized, onViewableItemsChanged]);

  // Memory-optimized render item
  const optimizedRenderItem = useCallback<ListRenderItem<T>>(({ item, index }) => {
    // Only render if in viewable range (when memory optimization is on)
    if (memoryOptimized && !viewableIndices.has(index)) {
      return (
        <View style={{ 
          height: itemHeight, 
          width: numColumns > 1 ? '50%' : '100%',
          backgroundColor: 'transparent' 
        }} />
      );
    }
    
    return renderItem({ item, index, separators: {} as any });
  }, [renderItem, itemHeight, numColumns, memoryOptimized, viewableIndices]);

  // Memoized FlatList props for performance
  const flatListProps = useMemo(() => ({
    ...props,
    ref: listRef,
    data,
    renderItem: optimizedRenderItem,
    getItemLayout: enableVirtualization ? getItemLayout : undefined,
    numColumns,
    removeClippedSubviews: enableVirtualization,
    maxToRenderPerBatch: itemsPerScreen,
    windowSize: 10,
    initialNumToRender: itemsPerScreen,
    updateCellsBatchingPeriod: 50,
    onViewableItemsChanged: handleViewableItemsChanged,
    viewabilityConfig: {
      itemVisiblePercentThreshold: 10,
      minimumViewTime: 100,
    },
    // Memory optimizations
    keyExtractor: (item: any, index: number) => 
      item?.id?.toString() || index.toString(),
    disableVirtualization: !enableVirtualization,
  }), [
    props,
    data,
    optimizedRenderItem,
    getItemLayout,
    numColumns,
    enableVirtualization,
    itemsPerScreen,
    handleViewableItemsChanged,
  ]);

  return <FlatList {...flatListProps} />;
}

// Specialized coin collection list with memory optimizations
interface CoinCollectionListProps<T> {
  coins: T[];
  renderCoin: ListRenderItem<T>;
  numColumns?: number;
  loading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function CoinCollectionList<T>({
  coins,
  renderCoin,
  numColumns = 2,
  loading = false,
  onRefresh,
  refreshing = false,
}: CoinCollectionListProps<T>) {
  // Adaptive item height based on screen size
  const screenWidth = Dimensions.get('window').width;
  const itemWidth = (screenWidth - 40) / numColumns; // 40px for padding
  const itemHeight = itemWidth + 100; // Image + text content

  // Memory management for large collections
  const memoryOptimized = coins.length > 50;
  const enableVirtualization = coins.length > 20;

  return (
    <VirtualizedList
      data={coins}
      renderItem={renderCoin}
      itemHeight={itemHeight}
      numColumns={numColumns}
      enableVirtualization={enableVirtualization}
      memoryOptimized={memoryOptimized}
      overscan={3}
      onRefresh={onRefresh}
      refreshing={refreshing}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: 120, // Space for tab bar
      }}
      columnWrapperStyle={numColumns > 1 ? {
        justifyContent: 'space-between',
        paddingHorizontal: 4,
      } : undefined}
    />
  );
}

export default VirtualizedList;