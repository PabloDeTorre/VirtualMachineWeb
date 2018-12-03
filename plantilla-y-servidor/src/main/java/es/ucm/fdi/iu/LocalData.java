package es.ucm.fdi.iu;

import java.io.File;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

/**
 * Uses constructor parameter as base for file-writing operations.
 * Can create missing intermediate directories. 
 *  
 * @author mfreire
 */
public class LocalData {    	    
	private static Log log = LogFactory.getLog(LocalData.class);

    private File baseFolder;
    
    public LocalData(File baseFolder) {
		this.baseFolder = baseFolder;
    	log.info("base folder is " + baseFolder.getAbsolutePath());
    	if (!baseFolder.isDirectory()) {
    		if (baseFolder.exists()) {
    			log.error("exists and is not a directory -- cannot create: " + baseFolder);
    		} else if ( ! baseFolder.mkdirs()){
    			log.error("could not be created -- check permissions " + baseFolder);        			
    		}
    	} else {
    		log.info("using already-existing base folder :-)");
    	}
    	baseFolder.mkdirs();
    }
    
    /**
     * @param folderName
     * @return a File pointing to the folder baseFolder/folderName, which will be
     * created if absent.
     */
    public File getFolder(String folderName) {
    	File folder = new File(baseFolder, folderName);
    	if ( ! folder.exists()) {
    		folder.mkdirs();
    	}
    	return folder;
    }
    
    /**
     * @param folderName
     * @param fileName
     * @return a File pointing to baseFolder/folderName/fileName. If
     * the file does not exist, it is not created.
     */
    public File getFile(String folderName, String fileName) {
    	return new File(getFolder(folderName), fileName);
    }
}