# YOLOv8 Exporter for Adobe After Effects

This script provides a semi-automatic method for generating YOLOv8 annotations from animated solid layers in Adobe After Effects. It was developed as part of a research project focused on efficient video annotation using image tracking and interpolation.

## 📌 Key Features

- Export bounding box labels compatible with YOLOv8 format  
- Normalize coordinates based on composition size  
- Automatically split frames into Train / Val / Test sets  
- Generate structured folders and `data.yaml` file  
- Simple UI panel for selecting classes and split ratios  
- No need for external models or plugins

## 🎓 Related Paper

This script is part of the methodology presented in the paper:  
**"A Fast and Consistent Method for Annotating Moving Objects in Videos Using Image Tracking"**  
*Author: Mahdi Pourkerman*  
GitHub Repository: [https://github.com/mahdipo/After-Effect-YOLOv8-Exporter](https://github.com/mahdipo/After-Effect-YOLOv8-Exporter)

YouTube How To Use: [https://www.youtube.com/watch?v=BFTl9CU7rwg](https://www.youtube.com/watch?v=BFTl9CU7rwg)

## 🛠 Requirements

- Adobe After Effects (tested on AE 2025 and later)
- Basic familiarity with AE solids and keyframe animation

## 📂 Output Structure

```
project/
│
├── images/
│   ├── train/
│   ├── val/
│   └── test/
│
├── labels/
│   ├── train/
│   ├── val/
│   └── test/
│
└── data.yaml
```

## 📥 How to Use
1. Close AfterEffect if it's open, copy the script to C:\Program Files\Adobe\Adobe After Effects "VersionNumber"\Support Files\Scripts\ScriptUI Panels\
2. Open AfterEffect -> edit->prefrences->scripting&experssions->allow script to write file and access network
3. Open your composition with solid layers representing tracked objects 
4. Select solid layers for export
4. Run the script and enter class names and split percentages  
5. Click "Export" to generate label files and render frame sequences  
6. Use the output with any YOLOv8-compatible training pipeline

## 📃 License

MIT License – Free for academic and commercial use with attribution.
