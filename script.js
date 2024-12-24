const imageContainer = document.querySelector('.image-container');
const largeImage = document.querySelector('.large-image');
const magnifier = document.getElementById('magnifier');
const toggleButton = document.getElementById('toggle-button');
const figureLabel = document.getElementById('figure-label');

// 定义图片路径和标签
const images = [
    { src: "SgrC_plain.png", label: "Plain colormap", button: "Show sources" },
    { src: "SgrC_sources.png", label: "Show sources", button: "Plain colormap" }
];

let currentImageIndex = 0; // 当前图片索引

// 切换图片和标签
toggleButton.addEventListener('click', () => {
    // 切换到下一个索引
    currentImageIndex = (currentImageIndex + 1) % images.length;

    // 更新图片、标签和按钮文本
    largeImage.src = images[currentImageIndex].src;
    figureLabel.textContent = images[currentImageIndex].label;
    toggleButton.textContent = images[currentImageIndex].button;
});

// 显示放大镜
imageContainer.addEventListener('mousemove', (e) => {
    const rect = imageContainer.getBoundingClientRect();
    const x = e.clientX - rect.left; // 鼠标相对容器的 X 坐标
    const y = e.clientY - rect.top;  // 鼠标相对容器的 Y 坐标

    // 显示放大镜
    magnifier.style.display = 'block';
    magnifier.style.left = `${x}px`;
    magnifier.style.top = `${y}px`;

    // 计算背景图的偏移，使鼠标居中
    const magnifierSize = magnifier.offsetWidth;
    const backgroundX = ((x / rect.width) * 100);
    const backgroundY = ((y / rect.height) * 100);

    magnifier.style.backgroundImage = `url(${largeImage.src})`; // 动态更新背景图
    magnifier.style.backgroundPosition = `${backgroundX}% ${backgroundY}%`;
    magnifier.style.transform = `translate(-50%, -50%)`; // 修正位置偏移
});

// 隐藏放大镜
imageContainer.addEventListener('mouseleave', () => {
    magnifier.style.display = 'none';
});
