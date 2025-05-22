/**
 * YOLOv8 Exporter Script for Adobe After Effects
 * -----------------------------------------------
 * Author: Mahdi Pourkerman
 * 
 * Description:
 * This script was developed as part of a semi-automatic annotation framework 
 * for labeling moving objects in videos using Adobe After Effects.
 * It allows users to export YOLOv8-compatible labels from animated solid layers,
 * automatically generating normalized bounding box data and structured output folders.
 * 
 * Related publication: 
 * "A Fast and Consistent Method for Annotating Moving Objects in Videos Using Image Tracking"
 */

//how to run:
//1-copy the script to C:\Program Files\Adobe\Adobe After Effects "VersionNumber"\Support Files\Scripts\ScriptUI Panels\
//2-edit->prefrences->scripting&experssions->allow script to write file and access network

(function() {
	

    var win = new Window("palette", "YOLOv8 Exporter V2", undefined, {resizeable: false});

    // اضافه کردن فیلدهای ورودی برای درصدها
    win.trainLabel = win.add("statictext", undefined, "Train Percentage:");
    win.trainInput = win.add("edittext", undefined, "70"); // Default value 70
    win.trainInput.characters = 5;

    win.valLabel = win.add("statictext", undefined, "Validation Percentage:");
    win.valInput = win.add("edittext", undefined, "20"); // Default value 20
    win.valInput.characters = 5;

    win.testLabel = win.add("statictext", undefined, "Test Percentage:");
    win.testInput = win.add("edittext", undefined, "10"); // Default value 10
    win.testInput.characters = 5;

	win.classNamesLabel = win.add("statictext", undefined, "Class Names");
	win.classNamesInput = win.add("edittext", undefined, "bcs175,bcs200,bcs225,bcs250,bcs275,bcs300,bcs325,bcs350"); // Default value ""
    win.classNamesInput.characters = 80;
	
win.classNamesLabel.multiline= true;


	
    // دکمه Export
    win.exportBtn = win.add("button", undefined, "Export");

    // عملکرد دکمه Export
    win.exportBtn.onClick = function() {
        var trainPercentage = parseFloat(win.trainInput.text);
        var valPercentage = parseFloat(win.valInput.text);
        var testPercentage = parseFloat(win.testInput.text);
		var classes_list=win.classNamesInput.text.split(',');
		
		
		
        // چک کردن صحت درصدها
        if (isNaN(trainPercentage) || isNaN(valPercentage) || isNaN(testPercentage)) {
            alert("❗ درصدها باید عدد باشند.");
            return;
        }

        if (trainPercentage + valPercentage + testPercentage !== 100) {
            alert("❗ مجموع درصدها باید 100 باشد.");
            return;
        }

        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            alert("❗ لطفاً یک کامپوزیشن انتخاب کنید.");
            return;
        }

        var outputFolder = Folder.selectDialog("📂 لطفاً پوشه خروجی را انتخاب کنید:");
        if (!outputFolder) {
            alert("❗ پوشه‌ای انتخاب نشد.");
            return;
        }

		//------make data.yaml
		var yamlFile = new File(outputFolder.fsName + "/"  + "data.yaml");
		yamlFile.encoding = "UTF8";
		yamlFile.open("w");
		yamlFile.write("train: ../images/train" + "\n"); 
		yamlFile.write("val: ../images/valid"+"\n");
		yamlFile.write("test: ../images/test"+"\n");
		yamlFile.write("\n");
		yamlFile.write("nc: "+classes_list.length+"\n");
		yamlFile.write("names: [");
		for(var t=0;t<classes_list.length ;t++)
		{
			yamlFile.write('\''+ classes_list[t]+ '\'');
			if(t<classes_list.length-1)
				yamlFile.write(',');
		}
		yamlFile.write("]");		
	    yamlFile.close();






        app.beginUndoGroup("Export Solids");
        try {
            // ساخت پوشه‌های اصلی
            var imageRoot = new Folder(outputFolder.fsName + "/images");
            var labelRoot = new Folder(outputFolder.fsName + "/labels");
            if (!imageRoot.exists) imageRoot.create();
            if (!labelRoot.exists) labelRoot.create();

            // ساخت زیرپوشه‌ها
            var splits = ["train", "val", "test"];
            for (var i = 0; i < splits.length; i++) {
                var imgFolder = new Folder(imageRoot.fsName + "/" + splits[i]);
                var lblFolder = new Folder(labelRoot.fsName + "/" + splits[i]);
                if (!imgFolder.exists) imgFolder.create();
                if (!lblFolder.exists) lblFolder.create();
            }

            alert("✅ پوشه‌ها ساخته شدند:\n" + imageRoot.fsName + "\n" + labelRoot.fsName);
        } catch (err) {
            alert("❌ خطا در ساخت پوشه‌ها:\n" + err.toString());
            return;
        }

var solids = [];
        var selectedLayers = comp.selectedLayers; // گرفتن لایه‌های انتخاب‌شده

        // فقط لایه‌های Solid انتخاب شده را اضافه کنیم
        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];

            if (
              layer instanceof AVLayer &&
              layer.source &&
              layer.source.mainSource &&
              layer.source.mainSource instanceof SolidSource
            ) {
                solids.push(layer);
            }
        }

        if (solids.length === 0) {
            alert("❗ هیچ Solid انتخاب نشده است.");
            return;
        }

        var totalFrames = Math.floor(comp.duration * comp.frameRate);

        // تقسیم فریم‌ها به سه گروه train, val, test بر اساس درصدها
        var trainFramesCount = Math.floor(totalFrames * (trainPercentage / 100));
        var valFramesCount = Math.floor(totalFrames * (valPercentage / 100));
        var testFramesCount = totalFrames - trainFramesCount - valFramesCount;


		var frameIndices = [];
        for (var i = 0; i < totalFrames; i++) {
            frameIndices.push(i);
        }

        var trainFrames = frameIndices.slice(0, trainFramesCount);
        var valFrames = frameIndices.slice(trainFramesCount, trainFramesCount + valFramesCount);
        var testFrames = frameIndices.slice(trainFramesCount + valFramesCount);

        alert(" Train frames count: " + trainFrames.length
		+"\n Validation frames count: " + valFrames.length
		+"\n Test frames count: " + testFrames.length);
		

		var rq = app.project.renderQueue;
        var tempCompName = "";
		 // ساخت  صف رندر خروجی
		 var splitFolder;
		 
		 var numSplit=3;	
		 for(k=0;k<3;k++)
		 {			 
			 if(k==0)			 
				if(trainFramesCount==0 )continue;	
			 if(k==1)			 
				if(valFramesCount==0 )continue;				 
			 if(k==2)			 
				if(testFramesCount==0) continue;				
			 			 
            try {                
                var tempComp = comp.duplicate();   

				// solids مخفی کردن همه لایه‌ها				
				                
                for (var i = 1; i < tempComp.numLayers; i++) {
					if (tempComp.layer(i) instanceof AVLayer &&
						tempComp.layer(i).source &&
						tempComp.layer(i).source.mainSource &&
						tempComp.layer(i).source.mainSource instanceof SolidSource &&
						tempComp.layer(i).nullLayer==false)
					{						
						tempComp.layer(i).transform.opacity.setValue(0);
					}   
					
                }

                // فعال کردن فقط Solid لایه‌ها
                //for (var s = 0; s < solids.length; s++) {
                //    var solidName = solids[s].name;
                //    var tempLayer = tempComp.layer(solidName);
                //    if (tempLayer) tempLayer.enabled = true;
                //}

                // اضافه کردن به Render Queue
                var rqItem = rq.items.add(tempComp);
                var frameName = "frame_[######].jpg";	

                var om = rqItem.outputModule(1);
                om.applyTemplate("YoloV8"); // قالب YoloV8 موجود             
			
			 if(k==0)
			 {				
				tempCompName="TrainSetComp"
				splitFolder = "train";
				rqItem.timeSpanStart = 0;
                rqItem.timeSpanDuration = trainFramesCount / comp.frameRate;      
			 }			 
			 	 
			 if(k==1)
			 {				
				tempCompName="ValidationSetComp"
				splitFolder = "val";
			    rqItem.timeSpanStart = trainFramesCount/ comp.frameRate;
                rqItem.timeSpanDuration = valFramesCount/ comp.frameRate;
			 }
			 
			 
			 if(k==2)
			 {				
				tempCompName="TestSetComp"
				rqItem.timeSpanStart = (trainFramesCount+valFramesCount)/ comp.frameRate;
                rqItem.timeSpanDuration = testFramesCount/ comp.frameRate;
				splitFolder = "test";
			 }
			 
			  tempComp.name = tempCompName;
				
                // Set the output file path
                om.file = new File(imageRoot.fsName + "/" + splitFolder + "/" + frameName );
				
                         

                // Set the render flag to true
                rqItem.render=true;

            } catch (err) {
                alert("⚠️ خطا در فریم 167" + f + ":\n" + err.toString());
                continue;
            }
		}


        
      

        for (var f = 0; f < totalFrames; f++) 
		{
			try {
				
				comp.time = f / comp.frameRate;
				
				var splitFolder;
				var isTrain = false, isVal = false, isTest = false;
				
				if( f>=trainFrames[0] && f<trainFrames[trainFrames.length-1])
				{
					isTrain = true;						
				}
				if( f>=valFrames[0] && f<valFrames[valFrames.length-1])
				{
					isVal = true;						
				}				
				
				if( f>=testFrames[0] && f<testFrames[testFrames.length-1])
				{
					isTest = true;						
				}	
				if (isTrain) splitFolder = "train";
				else if (isVal) splitFolder = "val";
				else if (isTest) splitFolder = "test";
				
				
			} catch (err) {
                alert("error 505:"+err.toString());
                continue;
            }
          
			var labelFrameName = "frame_" + ("000000" + f).slice(-6);
			
            // ذخیره فایل لیبل
            try {
				var outputStr="";
                for (var s = 0; s < solids.length; s++) {
                    var layer = solids[s];
					
					var startTime = layer.inPoint; // in seconds
					var startFrame = Math.round(startTime * comp.frameRate);
					
					var endTime = layer.outPoint; // in seconds
					var endFrame = Math.round(endTime * comp.frameRate);
					
					
					
					if(f>=startFrame && f<endFrame){
						var pos = layer.transform.position.valueAtTime(comp.time, false);
						var anchor = layer.transform.anchorPoint.valueAtTime(comp.time, false);  // نقطه anchor
						var scale = layer.transform.scale.valueAtTime(comp.time, false);						
												
						
						var width = layer.sourceRectAtTime(comp.time, false).width;  // عرض لایه
						var height = layer.sourceRectAtTime(comp.time, false).height;  // ارتفاع لایه

						// اطمینان از تبدیل صحیح مقادیر به float برای جلوگیری از مشکلات تقسیم
						var finalWidth = (width * scale[0] / 100);  // عرض نهایی در پیکسل
						var finalHeight = (height * scale[1] / 100);  // ارتفاع نهایی در پیکسل
						
						
						var ar_x=(width/2-anchor[0])/width;
						
						var ar_y=(height/2-anchor[1])/height;
						pos[0]+=finalWidth*ar_x;
						pos[1]+=finalHeight*ar_y;
			
						//alert("anchor:("+anchor[0]+","+anchor[1]+")		pos:("+pos[0]+","+pos[1]+")"+		"\nwidth,heghit:("+finalWidth+","+finalHeight+")");
						
						
						//pos[0]+=anchor[0]+(comp.width/2);
						//pos[1]+=anchor[1]+(comp.height/2);
						
						//960,540
						//1920,1080
						
						
						/*alert(layer.name + " is a " + layer.matchName);
						 if (layer instanceof AVLayer) 
						 {
							// اطمینان از این که لایه AVLayer است
							alert("لایه AVLayer است");
						 } */
						
						
						// محاسبه World Position در آن لحظه			
						/*var finalTransform = getFinalPositionAndScale(layer, comp.time);
						// نمایش نتایج
						//alert("پوزیشن نهایی: " + finalTransform.position[0] + "\nمقیاس نهایی (پیکسل): " + finalTransform.scale[0]);						
						
						pos=finalTransform.position;
						scale=finalTransform.scale;
						*/
						
										
						
						if (layer.parent) {
							// محاسبه نسبت به parent
							var parentPos = layer.parent.transform.position.valueAtTime(comp.time, false);
							var parentScale = layer.parent.transform.scale.valueAtTime(comp.time, false);
							
							pos = [pos[0] * parentScale[0] / 100 + parentPos[0], pos[1] * parentScale[1] / 100 + parentPos[1]];
							
							
							
							//scale in precent
							scale = [scale[0] * parentScale[0] / 100, scale[1] * parentScale[1] / 100];
							//convert to pixel
							scale[0]=comp.width*scale[0]/100;
							scale[1]=comp.height*scale[1]/100;
						}	
						
						
						
						var w = (scale[0] / comp.width).toFixed(6);
						var h = (scale[1] / comp.height).toFixed(6);
						var cx = (pos[0] / comp.width).toFixed(6);
						var cy = (pos[1] / comp.height).toFixed(6);

						var layer_class=0;
						for(var t=0;t<classes_list.length;t++)
						{
							if(classes_list[t]==layer.name)
							{
								layer_class=t;
							}
						}						
						outputStr+= layer_class+ " " + cx + " " + cy + " " + w + " " + h + "\n";
					}
					
                }
				if (outputStr != "") 
				{
					var labelFile = new File(labelRoot.fsName + "/" + splitFolder + "/" + labelFrameName + ".txt");
					labelFile.encoding = "UTF8";
					labelFile.open("w");				
					labelFile.write(outputStr); 
					//labelFile.write(layer_class+ " " + cx + " " + cy + " " + w + " " + h + "\n"); 
					labelFile.close();
				}
						
            } catch (err) {
                alert("⚠️ خطا در ذخیره لیبل در فریم " + f + ":\n" + err.toString());
                continue;
            }
        }
		



        alert("✅ عملیات با موفقیت به پایان رسید!");

        app.endUndoGroup();
    };

    // نمایش پنل
    win.center();
    win.show();
})();
