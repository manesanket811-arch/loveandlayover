import imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import imageminWebp from 'imagemin-webp';
import fs from 'fs';

async function optimizeImages() {
  try {
    console.log('🖼️  Starting image optimization...\n');

    // Optimize PNG files
    if (fs.existsSync('banner.png')) {
      console.log('Optimizing PNG files...');
      await imagemin(['banner.png'], {
        destination: '.',
        plugins: [
          imageminPngquant({
            quality: [0.6, 0.8],
            speed: 4
          })
        ]
      });
      console.log('✅ PNG optimization complete\n');
    }

    // Optimize JPEG files
    if (fs.existsSync('logo.jpg')) {
      console.log('Optimizing JPEG files...');
      await imagemin(['logo.jpg'], {
        destination: '.',
        plugins: [
          imageminMozjpeg({
            quality: 75,
            progressive: true
          })
        ]
      });
      console.log('✅ JPEG optimization complete\n');
    }

    // Create WebP versions
    console.log('Creating WebP versions...');
    const webpImages = ['banner.png', 'logo.jpg'].filter(f => fs.existsSync(f));

    for (const img of webpImages) {
      await imagemin([img], {
        destination: '.',
        plugins: [
          imageminWebp({ quality: 75 })
        ]
      });
    }
    console.log(`✅ WebP creation complete\n`);

    // Report file sizes
    console.log('📊 File size report:');
    const files = ['banner.png', 'logo.jpg', 'banner.png.webp', 'logo.jpg.webp'];
    files.forEach(file => {
      if (fs.existsSync(file)) {
        const size = fs.statSync(file).size;
        const sizeKb = (size / 1024).toFixed(2);
        console.log(`   ${file}: ${sizeKb} KB`);
      }
    });

    console.log('\n✨ Image optimization complete!');
  } catch (error) {
    console.error('❌ Error during optimization:', error.message);
    process.exit(1);
  }
}

optimizeImages();
