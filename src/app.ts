/*!
* Copyright (c) Microsoft Corporation. All rights reserved.
* Licensed under the MIT License.
*/

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import fetch from "cross-fetch";

/**
 * The main class of this app. All the logic goes here.
 */
export default class HistoryApp {
	private history: MRE.Actor[] = [];
	private lists: MRE.Actor[] = [];
	private assets: MRE.AssetContainer;

	constructor(private context: MRE.Context) {
		this.context.onStarted(() => this.started());
	}

	private started() {
		this.assets = new MRE.AssetContainer(this.context);

		const NufiBtn = MRE.Actor.CreateFromLibrary(this.context, {
			resourceId: 'artifact:1579239194507608147',
			actor: {
				name: 'Search Button',
				transform: {
					local: {
						position: { x: 0, y: 1, z: 0 }
					}
				},
				collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.5, z: 0.5 } } }
			}
		});
		
		NufiBtn.setBehavior(MRE.ButtonBehavior).onClick(user => {
			const checked = MRE.Actor.CreateFromLibrary(user.context, {
				resourceId: 'artifact:1143409001526984966',
				actor: {
					attachment: {
						attachPoint: "right-hand",
						userId: user.id
					},
					transform: {
						local: { rotation: { y: 50, z: -30, } }
					}
				}
			});	
			// this..attach(user, "head");
			user.prompt(`
		Type The Name Of the Moral Person
		(e.g. 'Victor Hugo').`, true)
			.then(res => {	
				if(res.submitted && res.text.length > 0){
					this.request(`{"nombre": "${res.text}", 
					"fecha_inicio": "01-01-2020", 
					"fecha_fin": "01-08-2020"}`, (res: any) => {
						const entidades = res.data.resultados.reverse()
						this.createList(0, "Entidades", -2, entidades, "entidad", (el: any) => {
							const entidad = res.data.resultados.find((x: any) => x.entidad === el.entidad);
							this.createList(1, "Expedientes", -4,
								entidad.expedientes.reverse(), "expediente", 
								(el: any) => {
									user.prompt(`Expediente: ${el.expediente}
Actor:
${el.actor.length > 60 ? el.actor.slice(0, 60) + " ...": el.actor}
Juzgado:
${el.juzgado.length > 60 ? el.juzgado.slice(0, 60) + " ..." : el.juzgado}`) 								
							});	
						});	
						return res;			
					});	
				}
			})
			.catch(err => {
				console.error(err);
			});
		});			
	}

	private request(body: string, callback: any){
		let req = fetch(
			"https://nufi.azure-api.net/antecedentes_judiciales/v2/persona_moral_nacional",
			{
				method: "POST",
				headers: {
					"Conteng-Type": "application/json",
					"NUFI-API-KEY": "dfabbcc369324f2b9628cfa9fb63211a",
				},
				body: body,
			})
		.then((res: any) => res.json())
		.then(callback);
	}

	private createList(list: number, tittle: string, px: any, elements: any[],
		keyName: string, callbackEl: any) {
		const x = 0;
		let y = 0;
		let button = null;

		if(this.lists[list])
			this.lists[list].destroy();
		
		this.lists[list] = MRE.Actor.Create(this.context, {
			actor: { transform: {
					local: { position: { x: px, y: 0, z: 0 } } 
				}
			}
		});	

		for(const element of elements){
			button = MRE.Actor.Create(this.context, {
				actor: {
					transform: { local: { position: { x: x + 0.1, y: y, z: 0 } } },
					collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.5, z: 0.5 } } },
					text: {
						contents: element[keyName],
						height: 0.1,
						anchor: MRE.TextAnchorLocation.MiddleLeft,
						justify: MRE.TextJustify.Left
					},
					parentId: this.lists[list].id
				}
			});		
			button.setBehavior(MRE.ButtonBehavior).onClick(() => callbackEl(element));
			y += 0.15;
		}

		MRE.Actor.Create(this.context, {
			actor: {
				transform: { local: { position: { x: x, y: y + 0.1, z: 0 } } },
				collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.5, z: 0.5 } } },
				text: {
					contents: tittle,
					height: 0.15,
					anchor: MRE.TextAnchorLocation.MiddleLeft,
					justify: MRE.TextJustify.Left
				},
				parentId: this.lists[list].id
			}
		});
	}	
}
