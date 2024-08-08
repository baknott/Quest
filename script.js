document.addEventListener('DOMContentLoaded', (event) => {
    const taskForm = document.getElementById('task-form');
    const titleInput = document.getElementById('title-input');
    const taskInput = document.getElementById('task-input');
    const addTaskButton = document.getElementById('add-task-button');
    const generateListButton = document.getElementById('generate-list-button');
    const tasksContainer = document.getElementById('tasks-container');
    const tempTaskList = document.getElementById('temp-task-list');
    const emojiDropdown = document.getElementById('emoji-dropdown');
    const emojiMenuButton = document.getElementById('emoji-menu-button');
    const showFinishedTasksCheckbox = document.getElementById('show-finished-tasks');
    let selectedEmoji = null;

    let taskIndex = 0;
    let currentTasks = [];

    addTaskButton.addEventListener('click', addTask);
    generateListButton.addEventListener('click', generateTaskList);
    emojiMenuButton.addEventListener('click', toggleEmojiMenu);

    emojiDropdown.addEventListener('click', (event) => {
        if (event.target.classList.contains('emoji')) {
            selectedEmoji = event.target.dataset.emoji;
            emojiMenuButton.textContent = selectedEmoji;
            toggleEmojiMenu();
        }
    });

    showFinishedTasksCheckbox.addEventListener('change', loadTasks);

    taskInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            addTaskButton.click();
        }
    });

    function toggleEmojiMenu() {
        emojiDropdown.classList.toggle('show');
    }

    function loadTasks() {
        tasksContainer.innerHTML = '';
        const taskLists = JSON.parse(localStorage.getItem('taskLists')) || [];
        const showFinished = showFinishedTasksCheckbox.checked;

        taskLists.forEach(list => {
            if (list.status === 'inprogress' || (list.status === 'finished' && showFinished)) {
                createTaskListElement(list.title, list.tasks, list.emoji, list.status);
            }
        });
    }

    function addTask() {
        const taskValue = taskInput.value.trim();
        if (taskValue) {
            const tempTask = { id: taskIndex++, text: taskValue, checked: false };
            currentTasks.push(tempTask);
            taskInput.value = '';
            addTempTaskElement(tempTask);
        }
    }

    function addTempTaskElement(task) {
        const tempTaskItem = document.createElement('div');
        tempTaskItem.className = 'temp-task-item';
        tempTaskItem.innerHTML = `<span>${task.text}</span><span class="remove-task" data-id="${task.id}">&times;</span>`;
        tempTaskList.appendChild(tempTaskItem);
        
        tempTaskItem.querySelector('.remove-task').addEventListener('click', () => {
            removeTempTask(task.id);
        });
    }

    function removeTempTask(taskId) {
        currentTasks = currentTasks.filter(task => task.id !== taskId);
        tempTaskList.querySelector(`[data-id="${taskId}"]`).parentElement.remove();
    }

    function generateTaskList() {
        const title = titleInput.value.trim();
        if (title && currentTasks.length > 0 && selectedEmoji) {
            saveTaskList(title, currentTasks, selectedEmoji, 'inprogress');
            createTaskListElement(title, currentTasks, selectedEmoji, 'inprogress');
            currentTasks = [];
            taskIndex = 0;
            titleInput.value = '';
            taskInput.value = '';
            tempTaskList.innerHTML = '';  // Clear the temporary tasks
            selectedEmoji = null;
            emojiMenuButton.textContent = '🏆';
        } else {
            alert('Veuillez remplir tous les champs et sélectionner un emoji.');
        }
    }

    function createTaskListElement(title, tasks, emoji, status) {
        const listContainer = document.createElement('div');
        listContainer.className = 'task-list';

        const titleElement = document.createElement('h3');
        titleElement.textContent = `${emoji} ${title}`;
        listContainer.appendChild(titleElement);

        const formElement = document.createElement('form');
        formElement.className = 'check-form';
        tasks.forEach(task => {
            const taskItem = createTaskElement(task.id, task.text, task.checked, title);
            formElement.appendChild(taskItem);
        });
        listContainer.appendChild(formElement);

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        const progressBarInner = document.createElement('div');
        progressBarInner.className = 'progress-bar-inner';
        progressBar.appendChild(progressBarInner);
        listContainer.appendChild(progressBar);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-list-button';
        deleteButton.innerHTML = '&times;';
        deleteButton.addEventListener('click', () => deleteTaskList(title, listContainer));
        listContainer.appendChild(deleteButton);

        tasksContainer.appendChild(listContainer);

        updateProgress(formElement, progressBarInner, title, listContainer);
    }

    function createTaskElement(taskId, taskValue, isChecked, listTitle) {
        const taskItem = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'task';
        checkbox.value = taskId;
        checkbox.checked = isChecked;
        checkbox.disabled = isChecked;
        checkbox.addEventListener('change', (event) => disableCheckbox(event, listTitle));

        const label = document.createElement('label');
        label.appendChild(document.createTextNode(taskValue));

        taskItem.appendChild(checkbox);
        taskItem.appendChild(label);

        return taskItem;
    }

    function disableCheckbox(event, listTitle) {
        const checkbox = event.target;
        if (checkbox.checked) {
            checkbox.disabled = true;
            updateTask(listTitle, parseInt(checkbox.value), true);
            const listContainer = checkbox.closest('.task-list');
            const progressBarInner = listContainer.querySelector('.progress-bar-inner');
            updateProgress(listContainer.querySelector('.check-form'), progressBarInner, listTitle, listContainer);
        }
    }

    function updateTask(listTitle, taskId, isChecked) {
        const taskLists = JSON.parse(localStorage.getItem('taskLists')) || [];
        const listIndex = taskLists.findIndex(list => list.title === listTitle);
        if (listIndex !== -1) {
            const taskIndex = taskLists[listIndex].tasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
                taskLists[listIndex].tasks[taskIndex].checked = isChecked;
                localStorage.setItem('taskLists', JSON.stringify(taskLists));
            }
        }
    }

    function saveTaskList(title, tasks, emoji, status) {
        const taskLists = JSON.parse(localStorage.getItem('taskLists')) || [];
        taskLists.push({ title, tasks, emoji, status });
        localStorage.setItem('taskLists', JSON.stringify(taskLists));
    }

    function updateProgress(formElement, progressBarInner, listTitle, listContainer) {
        const checkboxes = formElement.querySelectorAll('input[type="checkbox"]');
        const checkedCheckboxes = formElement.querySelectorAll('input[type="checkbox"]:checked');
        const total = checkboxes.length;
        const checked = checkedCheckboxes.length;

        const percentage = total === 0 ? 0 : Math.round((checked / total) * 100);
        progressBarInner.style.width = `${percentage}%`;
        progressBarInner.textContent = `${percentage}%`;

        const taskLists = JSON.parse(localStorage.getItem('taskLists')) || [];
        const listIndex = taskLists.findIndex(list => list.title === listTitle);
        if (listIndex !== -1) {
            if (percentage === 100) {
                progressBarInner.classList.add('flash');
                setTimeout(() => {
                    progressBarInner.classList.remove('flash');
                    progressBarInner.style.backgroundColor = 'gold';
                }, 1500);
                taskLists[listIndex].status = 'finished';
            } else {
                progressBarInner.style.backgroundColor = '#4caf50';
                taskLists[listIndex].status = 'inprogress';
            }
            localStorage.setItem('taskLists', JSON.stringify(taskLists));
        }
    }

    function deleteTaskList(title, listContainer) {
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
    
        const popup = document.createElement('div');
        popup.className = 'confirmation-popup';
        popup.innerHTML = `<p>Voulez-vous vraiment supprimer définitivement la quête "${title}" ?</p>
                           <button id="confirm-yes">Oui</button>
                           <button id="confirm-no">Non</button>`;
    
        document.body.appendChild(overlay);
        document.body.appendChild(popup);
    
        document.getElementById('confirm-yes').addEventListener('click', () => {
            const taskLists = JSON.parse(localStorage.getItem('taskLists')) || [];
            const updatedTaskLists = taskLists.filter(list => list.title !== title);
            localStorage.setItem('taskLists', JSON.stringify(updatedTaskLists));
            listContainer.remove();
            closeConfirmationPopup(overlay, popup);
        });
    
        document.getElementById('confirm-no').addEventListener('click', () => {
            closeConfirmationPopup(overlay, popup);
        });
    }
    
    function closeConfirmationPopup(overlay, popup) {
        document.body.removeChild(overlay);
        document.body.removeChild(popup);
    }

    loadTasks();
});
