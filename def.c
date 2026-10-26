#include<stdio.h>

struct Node{
    int val;
    struct Node* next;

};

struct Node* InsertionAtFirst(struct Node* head,int val){      //Insertion at begin
    struct Node *newNode = (struct Node *)malloc(sizeof(struct Node));

    newNode->val = val;
    newNode->next = head;

    return newNode;
}


struct Node* InsertionAtEnd(struct Node* head,int val){        //Insertion at End
    struct Node *newNode = (struct Node *)malloc(sizeof(struct Node));
    newNode->val = val;

    if(head==NULL) return newNode;
    struct Node *temp = head;

    while(temp->next != NULL ){
        temp=temp->next;
    }
    temp->next = newNode; 
    newNode->next = NULL;

    return head;
}


struct Node* InsertionAtIdx(struct Node* head,int val,int idx){ //Insertion at Idx
    if(idx==0) {
        head = InsertionAtFirst(head,val);
        return head;
    }

    struct Node *newNode = (struct Node *)malloc(sizeof(struct Node));
    newNode->val = val;
    struct Node *temp = head; 
    while (idx-1>0){
        temp = temp->next;
        idx--;
    }
    struct Node *temp2 = temp->next;
    temp->next = newNode;
    newNode->next = temp2;

    return head;
}

void printNode(struct Node* head){
    while (head != NULL){
        printf("%d ",head->val);
        head = head->next;
    }
    printf("\n");
    

}
int main(){
    struct Node *first = (struct Node *)malloc(sizeof(struct Node));
    struct Node *sec = (struct Node *)malloc(sizeof(struct Node));
    struct Node *third = (struct Node *)malloc(sizeof(struct Node));
    struct Node *forth = (struct Node *)malloc(sizeof(struct Node));
    struct Node *fifth = (struct Node *)malloc(sizeof(struct Node));

    first->val = 10;
    sec->val = 20;
    third->val = 30;
    forth->val = 40;
    fifth->val = 50;

    first->next = sec;
    struct Node *head = first;

    sec->next = third;
    third->next = forth;
    forth->next = fifth;
    fifth->next = NULL;

    head = InsertionAtFirst(head,0);
    printNode(head);

    head = InsertionAtEnd(head,60);
    printNode(head);

    head = InsertionAtIdx(head,70,3);
    printNode(head);

}