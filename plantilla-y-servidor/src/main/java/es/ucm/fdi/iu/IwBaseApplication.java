package es.ucm.fdi.iu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableTransactionManagement
public class IwBaseApplication {

	public static void main(String[] args) {
		SpringApplication.run(IwBaseApplication.class, args);
	}
}
