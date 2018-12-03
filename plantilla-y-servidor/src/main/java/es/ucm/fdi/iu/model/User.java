package es.ucm.fdi.iu.model;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.OneToMany;
import javax.persistence.Transient;

@Entity
public class User {
	private long id;
	private long apiKey;
	private List<Params> params = new ArrayList<>();
	private List<Group> groups = new ArrayList<>();
	
	@Transient
	private Map<String, Group> groupsByName;
	@Transient
	private Map<String, Params> paramsByName;
	
	@Id
	@GeneratedValue
	public long getId() {
	return id;
	}
	
	public void setId(long id) {
		this.id = id;
	}	

	@Column(unique=true)
	public long getApiKey() {
		return apiKey;
	}

	public void setApiKey(long apiKey) {
		this.apiKey = apiKey;
	}

	@OneToMany(targetEntity=Params.class)
	@JoinColumn(name="owner_id")	
	public List<Params> getParams() {
		return params;
	}
	
	public void setParams(List<Params> contents) {
		this.params = contents;
	}

	@OneToMany(targetEntity=Group.class)
	@JoinColumn(name="owner_id")	
	public List<Group> getGroups() {
		return groups;
	}
	
	public void setGroups(List<Group> groups) {
		this.groups = groups;
	}
	
	public Map<String, Group> groupMap() {
		if (groupsByName == null || groupsByName.isEmpty()) {
			groupsByName = groups.stream().collect(
					Collectors.toMap(Group::getName, Function.identity()));
		}
		return groupsByName;
	}
	
	public Map<String, Params> paramsMap() {
		if (paramsByName == null || paramsByName.isEmpty()) {
			paramsByName = params.stream().collect(
					Collectors.toMap(Params::getName, Function.identity()));
		}
		return paramsByName;
	}	
}
