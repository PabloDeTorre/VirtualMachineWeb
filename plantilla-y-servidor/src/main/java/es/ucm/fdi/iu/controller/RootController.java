package es.ucm.fdi.iu.controller;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.util.ArrayDeque;
import java.util.Collection;
import java.util.Deque;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

import javax.persistence.EntityManager;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;

import es.ucm.fdi.iu.LocalData;
import es.ucm.fdi.iu.model.GlobalState;
import es.ucm.fdi.iu.model.Group;
import es.ucm.fdi.iu.model.Io;
import es.ucm.fdi.iu.model.Params;
import es.ucm.fdi.iu.model.Set;
import es.ucm.fdi.iu.model.User;
import es.ucm.fdi.iu.model.Views;

@RestController	
public class RootController {

	private static Logger log = Logger.getLogger(RootController.class);

	@Autowired
	private EntityManager entityManager;
	
	@Autowired
	private LocalData localData;	

	private User getUser(long apiKey, boolean createIfAbsent) {
		List<User> results = entityManager.createQuery(
				"from User where apiKey = :apiKey", User.class)
	      .setParameter("apiKey", apiKey)
	      .getResultList();
		User u = null;
		if (results.isEmpty()) {
			if (createIfAbsent) {
				u = new User();
				u.setApiKey(apiKey);
				entityManager.persist(u);
				return u;
			} else {
				throw new IllegalArgumentException("Bad apiKey: " + apiKey);
			}
		} else {
			u = results.get(0);
		}
		return u;		
	}
	
	/**
	 * Finds groups reachable from a given target.
	 * @param target group.
	 * @return set of groups that are reachable from target.
	 */
	private HashSet<String> findReachable(User u, Group target) {		
		Deque<String> pending = new ArrayDeque<>();
		HashSet<String> found = new HashSet<>();
		pending.push(target.getName());
		while ( ! pending.isEmpty()) {
			String name = pending.pop();
			if (u.groupMap().containsKey(name)) {
				found.add(name);
				// add a its names to recurse into
				for (String child : u.groupMap().get(name).getElements()) {
					pending.push(child);					
				}
			}
		}
		return found;
	}

	/**
	 * Finds machines in a given list of names, which can be both 
	 * machines or sets
	 * @param u user
	 * @param names
	 * @return set of vms, without duplicates
	 */
	private HashSet<Params> findMachines(User u, String ...names) {
	
		Deque<String> pending = new ArrayDeque<>();
		HashSet<Params> found = new HashSet<>();
		for (String name : names) {
			if (u.groupMap().containsKey(name)) {
				pending.push(name);
			} else {
				found.add(u.paramsMap().get(name));
			}
		}
		while ( ! pending.isEmpty()) {
			String name = pending.pop();
			if (u.groupMap().containsKey(name)) {
				// add a new group to recurse into, and also to found
				pending.push(name);
			} else {
				found.add(u.paramsMap().get(name));
			}
		}
		return found;
	}	
	
	@GetMapping({"/", "/index"})
	public String root() {
		log.info("entra en app sin ApiKey");		
		return "Te has olvidado de incluir una ApiKey en tu URL";
	}

	@JsonView(Views.Public.class)
	@RequestMapping("/{apiKey}/list")
	@Transactional
	public GlobalState list(
			@PathVariable long apiKey) {
		log.info(apiKey + "/list/");
		return new GlobalState(getUser(apiKey, true));
	}	
	
	@JsonView(Views.Public.class)
	@PostMapping("/{apiKey}/add")
	@Transactional
	public GlobalState add(
			@PathVariable long apiKey,
			@RequestBody Params data) throws JsonProcessingException {
		log.info(apiKey + "/add/" + new ObjectMapper().writeValueAsString(data));
		
		if (data.getName() == null 
				|| data.getCpu() == 0 
				|| data.getHdd() == 0 
				|| data.getIp() == null 
				|| data.getRam() == 0) {
			throw new IllegalArgumentException("Bad or missing initial parameters");
		}
		
		User u = getUser(apiKey, true);
		if (u.paramsMap().get(data.getName()) != null
				|| u.groupMap().get(data.getName()) != null) {
			throw new IllegalArgumentException("Name already exists");
		}	
		if (data.getIso() != null) {
			if ( ! hasFile(apiKey, data.getIso())) {
				throw new IllegalArgumentException("Invalid iso: upload it first");				
			}
		}
		
		data.setAction(null);
		data.setState("stop");
		entityManager.persist(data);
		u.getParams().add(data);
		return new GlobalState(u);
	}	
	
	@JsonView(Views.Public.class)
	@PostMapping("/{apiKey}/rm")
	@Transactional
	public GlobalState rm(
			@PathVariable long apiKey,
			@RequestBody Group data) throws JsonProcessingException {
		log.info(apiKey + "/rm/" + new ObjectMapper().writeValueAsString(data));
		
		if (data.getElements() == null 
				|| data.getElements().isEmpty()) {
			throw new IllegalArgumentException("Nothing to remove");
		}
		
		User u = getUser(apiKey, false);
		for (String name: data.getElements()) {
			if (u.groupMap().containsKey(name)) {
				Group g = u.groupMap().get(name);
				u.getGroups().remove(g);
			} else if (u.paramsMap().containsKey(name)) {
				Params vm = u.paramsMap().get(name);
				u.getParams().remove(vm);
			} else {
				throw new IllegalArgumentException("Cannot remove " + name + ": not found");
			}
		}
		// ok, now to remove these elements from all groups
		for (Group group: u.getGroups()) {
			group.getElements().removeAll(data.getElements()); 
		}
		return new GlobalState(u);
	}	
	
	@JsonView(Views.Public.class)
	@PostMapping("/{apiKey}/set")
	@Transactional
	public GlobalState set(
			@PathVariable long apiKey,
			@RequestBody Set data) throws JsonProcessingException {
		log.info(apiKey + "/set/" + new ObjectMapper().writeValueAsString(data));
		
		if (data.getNames().length == 0) {
			throw new IllegalArgumentException("Bad or missing initial parameters");
		}
		
		User u = getUser(apiKey, false);
		Collection<Params> affected = findMachines(u, data.getNames());
		log.info(apiKey + "/set/ -- expanded to affect:" + 
		    affected.stream().map(Params::getName).collect(Collectors.joining(", ")));
		if (affected.size() > 1 && data.getName() != null) {
			throw new IllegalArgumentException("Cannot rename many VMs to share a name");			
		}		
		for (Params vm : affected) {
			if (data.getName() != null) {
				vm.setName(data.getName());
			}
			if (data.getAction() != null) {
				vm.setState(data.getAction());
			}
			if (data.getIp() != null) {
				vm.setIp(data.getIp());
			}
			if (data.getIso() != null) {
				if (!hasFile(apiKey, data.getIso())) {
					throw new IllegalArgumentException(
							"Cannot set iso to file that was never uploaded:" + 
									data.getIso());
				}
				vm.setIso(data.getIso());
			}
			vm.setRam(data.getRam()!=0 ? data.getRam(): vm.getRam());
			vm.setHdd(data.getHdd()!=0 ? data.getHdd(): vm.getHdd());
			vm.setCpu(data.getCpu()!=0 ? data.getCpu(): vm.getCpu());
			vm.setCores(data.getCores()!=0 ? data.getCores(): vm.getCores());
		}	
	
		return new GlobalState(u);
	}
	
	@JsonView(Views.Public.class)
	@PostMapping("/{apiKey}/link")
	@Transactional
	public GlobalState link(
			@PathVariable long apiKey,
			@RequestBody Group data) throws JsonProcessingException {
		log.info(apiKey + "/add/" + new ObjectMapper().writeValueAsString(data));
		
		if (data.getName() == null 
				|| data.getElements() == null) {
			throw new IllegalArgumentException("Bad or missing initial parameters");
		}
		
		User u = getUser(apiKey, false);
		if (u.paramsMap().get(data.getName()) != null) {
			throw new IllegalArgumentException("Invalid group name: VM with that name already exists");
		}
		
		Group target = u.groupMap().get(data.getName());
		if (target == null) {
			// create new empty group instead of complaining
			target = new Group();
			target.setName(data.getName());
			u.getGroups().add(target);
			entityManager.persist(target);
		}
		HashSet<String> indirect = findReachable(u, target);			
		
		for (String name : data.getElements()) {
			if ( ! u.groupMap().containsKey(name) && 
				 ! u.paramsMap().containsKey(name)) {
				throw new IllegalArgumentException("No such name: " + name);
			}
			if (indirect.contains(name)) {
				throw new IllegalArgumentException("Group " + data.getName() + 
						" already contains, directly or indirectly, " + name);
			} else {
				target.getElements().add(name);
			}
		}
		return new GlobalState(u);
	}	
	
	@JsonView(Views.Public.class)
	@PostMapping("/{apiKey}/unlink")
	@Transactional
	public GlobalState unlink(
			@PathVariable long apiKey,
			@RequestBody Group data) throws JsonProcessingException {
		log.info(apiKey + "/add/" + new ObjectMapper().writeValueAsString(data));
		
		if (data.getName() == null 
				|| data.getElements() == null 
				|| data.getElements().isEmpty()) {
			throw new IllegalArgumentException("Bad or missing initial parameters");
		}
		
		User u = getUser(apiKey, false);
		Group target = u.groupMap().get(data.getName());
		if (target == null) {
			throw new IllegalArgumentException("Group to remove from does not exist");

		}	
		for (String name : data.getElements()) {
			if ( !target.getElements().remove(name)) {
				throw new IllegalArgumentException("Element to remove does not exist");				
			}
		}
		return new GlobalState(u);
	}
	
	@JsonView(Views.Public.class)
	@PostMapping("/{apiKey}/import") 
	@Transactional
	public GlobalState vtimport(
			@PathVariable long apiKey,
			@RequestBody Io data) throws Exception {
		log.info(apiKey + "/import/" + new ObjectMapper().writeValueAsString(data));
		
		if (data.getName() == null  
				|| data.getFileName() == null) {
			throw new IllegalArgumentException("Bad or missing initial parameters");
		}
		
		User u = getUser(apiKey, true);
		if (u.paramsMap().get(data.getName()) != null
				|| u.groupMap().get(data.getName()) != null) {
			throw new IllegalArgumentException("Name already exists");
		}	
		if ( ! hasFile(apiKey, data.getFileName())) {
			throw new IllegalArgumentException("No such file, upload it first " + 
					data.getFileName());
		} else {
			File f = localData.getFile("user/" + apiKey, 
					data.getFileName().replaceAll("/", "_"));
			String json = new String(Files.readAllBytes(f.toPath()), "UTF-8");
	        Params vm = new ObjectMapper().readValue(json, Params.class);
	        vm.setName(data.getName());
	        vm.setAction(null);
	        vm.setState("stop");
	        vm.setIso(null);
			u.getParams().add(vm);
			entityManager.persist(vm);
		}
		return new GlobalState(u);
	}
	
	@JsonView(Views.Public.class)
	@PostMapping("/{apiKey}/export") 
	@Transactional
	public GlobalState vtexport(
			@PathVariable long apiKey,
			@RequestBody Io data) throws Exception {
		log.info(apiKey + "/export/" + new ObjectMapper().writeValueAsString(data));
		
		if (data.getName() == null  
				|| data.getFileName() == null) {
			throw new IllegalArgumentException("Bad or missing initial parameters");
		}
		
		User u = getUser(apiKey, true);
		Params vm = u.paramsMap().get(data.getName());
		if (vm == null) {
			throw new IllegalArgumentException("Name not from valid vm");
		}	
		if (hasFile(apiKey, data.getFileName())) {
			throw new IllegalArgumentException("Destination file already exists: " + 
					data.getFileName());
		} 
		ObjectMapper om = new ObjectMapper();
		om.disable(MapperFeature.DEFAULT_VIEW_INCLUSION);
		om.setConfig(om.getSerializationConfig()
                .withView(Views.Public.class));
		String json = om.writeValueAsString(vm);
		File f = localData.getFile("user/" + apiKey, 
				data.getFileName().replaceAll("/", "_"));
        try (BufferedOutputStream stream =
                new BufferedOutputStream(new FileOutputStream(f))) {
        	stream.write(json.getBytes("UTF-8"));
        }
		
		return new GlobalState(u);
	}	
	
	@GetMapping("/{apiKey}/file")
	public String[] listFiles(
			@PathVariable long apiKey) {
		log.info(apiKey + "/file (GET)");

		File dir = localData.getFile("user", ""+apiKey);
		if (dir.isDirectory()) {
			return dir.list();
		} else {
			return new String[0];
		}
	}

	@DeleteMapping("/{apiKey}/file/{fileId}")
	public @ResponseBody String rmFile(
			@PathVariable long apiKey,
			@PathVariable String fileId,
    		HttpServletResponse response) {
		log.info(apiKey + "/file (DELETE), " + fileId);
		
        File f = localData.getFile("user/" + apiKey, 
        		fileId.replaceAll("/", "_"));
		String error = "";
        if ( ! f.isFile()) {
        	error = "File not found: " + f.getAbsolutePath();        
        } else if ( ! f.delete()) {
        	error = "Could not delete: " + f.getAbsolutePath();        
        } else {
        	return "OK";
        }
        // exit with error, blame user
    	response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        return error;
	}
	
	@PostMapping("/{apiKey}/file/{fileId}")
    public @ResponseBody String uploadFile(
    		@PathVariable long apiKey,
    		@RequestParam MultipartFile file,
    		@PathVariable String fileId,
    		HttpServletResponse response){

		log.info(apiKey + "/file (POST), " + fileId);
		
		String error = "";
        if (file.isEmpty() || fileId.isEmpty()) {
        	error = "You failed to upload an iso image for " 
                + apiKey + "/" + fileId + " because the file or its name was empty.";        
        } else {
	        File f = localData.getFile("user/" + apiKey, 
	        		fileId.replaceAll("/", "_"));
	        try (BufferedOutputStream stream =
	                new BufferedOutputStream(
	                    new FileOutputStream(f))) {
	            stream.write(file.getBytes());
	            return "Uploaded " + apiKey + "/" + fileId +
	            	    " into " + f.getAbsolutePath() + "!";
	        } catch (Exception e) {
		    	error = "Upload failed " + apiKey + "/" + fileId + 
		    			" => " + e.getMessage();
	        }
        }
        // exit with error, blame user
    	response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        return error;
	}
	
	/**
	 * Checks if an iso file exists
	 * @param apiKey
	 * @param fileId
	 * @return true if the file exists and is readable, false otherwise
	 */
	private boolean hasFile(long apiKey, String fileId) {
		return localData.getFile("user/" + apiKey, 
				fileId.replaceAll("/", "_")).canRead();
	}

	/**
	 * Returns a users' photo
	 * @param id of user to get photo from
	 * @return the image, or error
	 */
	@RequestMapping(value="/{apiKey}/file/{fileId}", 
			method = RequestMethod.GET, 
			produces = MediaType.TEXT_PLAIN_VALUE)
	public void getFile(@PathVariable long apiKey,
			@PathVariable String fileId,
			HttpServletResponse response) {

		log.info(apiKey + "/file (GET), " + fileId);
				
	    File f = localData.getFile("user/" + apiKey, 
	    		fileId.replaceAll("/", "_"));
	    try (InputStream in = f.exists() ? 
		    	new BufferedInputStream(new FileInputStream(f)) :
		    	new BufferedInputStream(this.getClass().getClassLoader()
		    			.getResourceAsStream("unknown-user.jpg"))) {
	    	FileCopyUtils.copy(in, response.getOutputStream());
	    } catch (IOException ioe) {
	    	response.setStatus(HttpServletResponse.SC_NOT_FOUND); // 404
	    	log.info("Error retrieving file: " + f + " -- " + ioe.getMessage());
	    }
	}	
}
