package com.example.healthcare.repository;



import com.example.healthcare.Model.Role;
import com.example.healthcare.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


public interface UserRepository extends JpaRepository<User, Long> {
    User findByEmail(String email);

    List<User> findAllByRole(Role role);

    List<User> findByRole(Role role);
}
