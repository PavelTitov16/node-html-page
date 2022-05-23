const fs = require('fs');
const {
    access,
    readdir,
    readFile,
    copyFile,
    mkdir,
    rm,
} = require('fs/promises');
const path = require('path');
const folderPath = path.join(__dirname, 'styles');

async function сreatePage() {
    try {
        const componentPath = path.join(__dirname, 'components');
        const components = await readdir(componentPath, {withFileTypes: true});
        const templatePath = path.join(__dirname, 'template.html');
        let templateData = await readFile(templatePath, 'utf-8');
        const projectFile = fs.createWriteStream(path.join(__dirname, 'project-dist', 'index.html'), 'utf-8');

        for (let component of components) {
            let currentComponent = path.parse(path.join(componentPath, component.name));
            if (component.isFile() && path.extname(component.name) === '.html') {
                const componentFragment = await readFile(path.join(componentPath, component.name), 'utf-8');

                templateData = templateData.replace(new RegExp(`{{${currentComponent.name}}}`, 'g'), componentFragment);
            }
        }
        projectFile.write(templateData);
    }
    
    catch (error) {
        return console.error(error.message);
    }
};

async function mergeStyles() {
    const bundlePath = fs.createWriteStream(path.join(__dirname, 'project-dist', 'style.css'));
    try {
        const styles = await readdir(folderPath, {
            withFileTypes: true
        });
        styles.forEach((style) => {
            if (style.isFile() && path.extname(style.name) === '.css') {
                const inputPath = fs.createReadStream(path.join(folderPath, style.name), 'utf-8');
                inputPath.pipe(bundlePath, {
                    end: false
                });
            }
        });
    } catch (error) {
        return console.error(error.message);
    }
};

async function copyAssets(from, to) {
    const files = await readdir(from, {withFileTypes: true});
    const nameFolder = path.basename(from);
    const copyDirectory = path.join(to, nameFolder);
    await mkdir(copyDirectory);
    try {
    files.forEach((file) => {
        if (file.isFile()) {
            copyFile(path.join(from, file.name), path.join(copyDirectory, file.name));
        } else {
            copyAssets(path.join(from, file.name), copyDirectory);
        }
    });
    }
    catch (error) {
    return console.error(error.message);
    }
}

async function сopyFolder() {
    const assetsPath = path.join(__dirname, 'assets');
    const copyPath = path.join(__dirname, 'project-dist');
    try {
        await access(copyPath, {
            recursive: true
        });
        await rm(copyPath, {
            recursive: true
        });
        await mkdir(copyPath, {
            recursive: true
        });
        copyAssets(assetsPath, copyPath);
    } catch (error) {
        await mkdir(copyPath, {
            recursive: true
        });
        copyAssets(assetsPath, copyPath);
    };
}

(async function createDirectoty(data) {
    try {
        await access(data, {
            recursive: true
        });
        await rm(data, {
            recursive: true
        });
        await mkdir(data, {
            recursive: true
        });
        сreatePage();
        mergeStyles();
        сopyFolder();
    } catch (error) {
        await mkdir(data, {
            recursive: true
        });
        сreatePage();
        mergeStyles();
        сopyFolder();
    }
})(path.join(__dirname, 'project-dist'));