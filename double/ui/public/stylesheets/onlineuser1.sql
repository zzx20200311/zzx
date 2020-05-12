create table onlineuser1
(
    UserName varchar(255)  not null comment '用户名',
    SocketID varchar(255)  not null comment '用户socketid',
    constraint user_UserName_uindex
        unique (UserName)
)
comment '登录在服务器1的用户';
