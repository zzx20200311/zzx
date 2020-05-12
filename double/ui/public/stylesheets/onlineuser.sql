create table onlineuser3
(
    UserName varchar(255)  not null comment '用户名',
    SocketID varchar(255)  not null comment '用户ID',
    Server     int default 0 null comment '用户所在服务器',
    constraint user_UserName_uindex
        unique (UserName)
)
comment '用户';
