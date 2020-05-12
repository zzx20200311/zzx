create table user
(
    UserName varchar(255)  not null comment '用户名',
    Password varchar(255)  not null comment '用户密码',
    Role     int default 0 null comment '用户角色',
    constraint user_UserName_uindex
        unique (UserName)
)
comment '用户';
