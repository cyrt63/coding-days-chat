var socket = io.connect('https://coding-days.herokuapp.com') || 
    io.connect('https://coding-days-chat.herokuapp.com') ||
    io.connect('http://localhost:3000');

$(document).ready(function () {

    function validerForm() {
        if (
            $('textarea[name="message"]').val() == '' ||
            $('input[name="username"]').val() == ''
        ) {
            alert('les champs ne doivent pas être vide');
            return false;
        } else {
            return true;
        }
    }

    function viderMessage() {
        $('textarea[name="message"]').val('');
    }

    $('form').submit(function (event) {

        event.preventDefault();

        if (!validerForm()) return;

        let message = $('textarea[name="message"]').val();
        let username = $('input[name="username"]').val();

        console.log('username %s', username);
        console.log('message %s', message);

        socket.emit('newmsg', {
            username: username,
            message: message
        });

        viderMessage();

    });

    $(document)
        .keydown(function (event) {
            if (event.keyCode == 13) {
                $('form').submit();
            }
        });

    socket.on('displaymsg', function (data) {

        console.log('newmsg : @%s : %s', data.username, data.message);

        $('.messages').append('<article class="message"><p><strong>' + data.username + '</strong></p><p>' + data.message + '</p> </article>');
        $('.messages').animate({
            "scrollTop": $('.messages')[0].scrollHeight
        }, "slow");

    });

    socket.on('newUser', function (user) {

        $('.userslist').append('<li>' + user + '</li>');

    });

    socket.on('allUsers', users => {

        $('.userslist').empty();

        if (Array.isArray(users)) {

            users.forEach(user => {

                $('.userslist').append('<li>' + user + '</li>');

            });

        }

    });

});