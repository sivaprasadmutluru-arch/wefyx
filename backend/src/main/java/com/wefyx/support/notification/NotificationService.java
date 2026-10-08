package com.wefyx.support.notification;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service public class NotificationService{
 private final AccountNotificationRepository repository;private final JavaMailSender mail;private final boolean mailEnabled;private final String from;
 public NotificationService(AccountNotificationRepository r,JavaMailSender mail,@Value("${wefyx.mail.enabled:false}")boolean mailEnabled,@Value("${wefyx.mail.from:support@wefyx.pro}")String from){repository=r;this.mail=mail;this.mailEnabled=mailEnabled;this.from=from;}
 public void send(String email,Long requirementId,String type,String title,String message){var n=new AccountNotification();n.setRecipientEmail(email);n.setRequirementId(requirementId);n.setType(type);n.setTitle(title);n.setMessage(message);n.setDeepLinkUrl(requirementId==null?null:"/portal?requirementId="+requirementId);repository.save(n);sendEmail(email,title,message,n.getDeepLinkUrl());}
 private void sendEmail(String to,String title,String message,String link){if(!mailEnabled||to==null||to.isBlank())return;try{var m=new SimpleMailMessage();m.setFrom(from);m.setTo(to);m.setSubject("Wefyx · "+title);m.setText(message+(link==null||link.isBlank()?"":"\n\nOpen: "+link)+"\n\nWefyx");mail.send(m);}catch(Exception ignored){}}
}
