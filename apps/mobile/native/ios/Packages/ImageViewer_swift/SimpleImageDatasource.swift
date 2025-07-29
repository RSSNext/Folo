class SimpleImageDatasource:ImageDataSource {
    
    private(set) var imageItems:[ImageItem]
    
    init(imageItems: [ImageItem]) {
        self.imageItems = imageItems
    }
    
    func numberOfImages() -> Int {
        return imageItems.count
    }
    
    func imageItem(at index: Int) -> ImageItem {
        return imageItems[index]
    }
}
