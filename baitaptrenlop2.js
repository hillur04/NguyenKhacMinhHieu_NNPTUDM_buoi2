//HTTP request Get,post,put,delete
async function Load() {
    try {
        let res = await fetch('http://localhost:3000/posts')
        let data = await res.json();
        let body = document.getElementById("table-body");
        body.innerHTML = "";
        for (const post of data) {
            let titleDisplay = post.isDeleted ? `<s>${post.title}</s>` : post.title;
            let viewsDisplay = post.isDeleted ? `<s>${post.views}</s>` : post.views;
            body.innerHTML += `
            <tr>
                <td>${post.id}</td>
                <td>${titleDisplay}</td>
                <td>${viewsDisplay}</td>
                <td><input value="Delete" type="submit" onclick="Delete(${post.id})" /></td>
            </tr>`
        }
    } catch (error) {

    }
}async function SelectComment(id) {
    let res = await fetch('http://localhost:3000/comments/' + id);
    if (res.ok) {
        let comment = await res.json();
        document.getElementById("comment_id_txt").value = comment.id;
        document.getElementById("comment_text_txt").value = comment.text;
    }
}
async function UpdateComment() {
    let id = document.getElementById("comment_id_txt").value;
    let text = document.getElementById("comment_text_txt").value;
    if (!id) {
        alert("Please select a comment to update");
        return;
    }
    let getRes = await fetch('http://localhost:3000/comments/' + id);
    if (getRes.ok) {
        let comment = await getRes.json();
        let res = await fetch('http://localhost:3000/comments/' + id, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ...comment,
                text: text
            })
        });
        if (res.ok) {
            console.log("comment updated");
            LoadComments();
            // Clear form
            document.getElementById("comment_id_txt").value = "";
            document.getElementById("comment_text_txt").value = "";
        }
    }
}async function Save() {
    let id = document.getElementById("id_txt").value;
    let title = document.getElementById("title_txt").value;
    let views = document.getElementById("views_txt").value;
    let res;
    if (!id) {
        // Tạo mới, tự động ID
        let postsRes = await fetch('http://localhost:3000/posts');
        let posts = await postsRes.json();
        let maxId = 0;
        for (const post of posts) {
            let numId = parseInt(post.id);
            if (numId > maxId) maxId = numId;
        }
        id = (maxId + 1).toString();
        res = await fetch('http://localhost:3000/posts', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(
                {
                    id: id,
                    title: title,
                    views: views,
                    isDeleted: false
                }
            )
        });
    } else {
        let getID = await fetch('http://localhost:3000/posts/' + id);
        if (getID.ok) {
            // Update
            let existing = await getID.json();
            res = await fetch('http://localhost:3000/posts/'+id, {
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(
                    {
                        ...existing,
                        title: title,
                        views: views
                    }
                )
            });
        } else {
            // Create với ID đã nhập
            res = await fetch('http://localhost:3000/posts', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(
                    {
                        id: id,
                        title: title,
                        views: views,
                        isDeleted: false
                    }
                )
            });
        }
    }
    if (res.ok) {
        console.log("them thanh cong");
        Load(); // Reload sau save
    }
}
async function Delete(id) {
    let getRes = await fetch('http://localhost:3000/posts/' + id);
    if (getRes.ok) {
        let post = await getRes.json();
        let res = await fetch('http://localhost:3000/posts/' + id, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ...post,
                isDeleted: true
            })
        });
        if (res.ok) {
            console.log("xoa mem thanh cong");
            Load(); // Reload sau delete
        }
    }
}
async function LoadComments() {
    try {
        let res = await fetch('http://localhost:3000/comments')
        let data = await res.json();
        let body = document.getElementById("comments-table-body");
        body.innerHTML = "";
        for (const comment of data) {
            let textDisplay = comment.isDeleted ? `<s>${comment.text}</s>` : comment.text;
            body.innerHTML += `
            <tr data-id="${comment.id}" onclick="SelectComment(${comment.id})" style="cursor: pointer;">
                <td>${comment.id}</td>
                <td>${textDisplay}</td>
                <td>
                    <input value="Delete" type="button" onclick="DeleteComment(${comment.id}); event.stopPropagation();" />
                </td>
            </tr>`
        }
    } catch (error) {

    }
}
function EditComment(id) {
    let tr = document.querySelector(`tr[data-id="${id}"]`);
    let tdText = tr.children[1];
    let text = tdText.innerText; // Lấy text, bỏ <s> nếu có
    tdText.innerHTML = `<input type="text" value="${text}" id="edit_text_${id}" />`;
    let tdActions = tr.children[2];
    tdActions.innerHTML = `
        <input value="Save" type="button" onclick="SaveEdit(${id})" />
        <input value="Cancel" type="button" onclick="LoadComments()" />
    `;
}
async function SaveComment() {
    let text = document.getElementById("comment_text_txt").value;
    if (!text) {
        alert("Please enter text");
        return;
    }
    // Tạo mới, tự động ID
    let commentsRes = await fetch('http://localhost:3000/comments');
    let comments = await commentsRes.json();
    let maxId = 0;
    for (const comment of comments) {
        let numId = parseInt(comment.id);
        if (numId > maxId) maxId = numId;
    }
    let id = (maxId + 1).toString();
    let res = await fetch('http://localhost:3000/comments', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(
            {
                id: id,
                text: text,
                isDeleted: false
            }
        )
    });
    if (res.ok) {
        console.log("comment saved");
        LoadComments();
        // Clear form
        document.getElementById("comment_text_txt").value = "";
    }
}
async function DeleteComment(id) {
    let getRes = await fetch('http://localhost:3000/comments/' + id);
    if (getRes.ok) {
        let comment = await getRes.json();
        let res = await fetch('http://localhost:3000/comments/' + id, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ...comment,
                isDeleted: true
            })
        });
        if (res.ok) {
            console.log("comment deleted softly");
            LoadComments(); // Reload sau delete
        }
    }
}
Load();
LoadComments();
